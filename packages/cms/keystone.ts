import cors from 'cors'
import { config } from '@keystone-6/core'
import { listDefinition as lists } from './lists'
import appConfig from './config'
import envVar from './environment-variables'
import { Request, Response, NextFunction } from 'express'
import { createAuth } from '@keystone-6/auth'
import { statelessSessions } from '@keystone-6/core/session'
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache'
import express from 'express'
import path from 'path'

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  sessionData: 'name role',
  secretField: 'password',
  initFirstItem: {
    // If there are no items in the database, keystone will ask you to create
    // a new user, filling in these fields.
    fields: ['name', 'email', 'password', 'role'],
  },
})

const session = statelessSessions(appConfig.session)

export default withAuth(
  config({
    db: {
      provider: appConfig.database.provider,
      url: appConfig.database.url,
      idField: {
        kind: 'autoincrement',
      },
    },
    ui: {
      // If `isDisabled` is set to `true` then the Admin UI will be completely disabled.
      isDisabled: envVar.isUIDisabled,
      // For our starter, we check that someone has session data before letting them see the Admin UI.
      isAccessAllowed: (context) => !!context.session?.data,
    },
    lists,
    session,
    storage: {
      files: {
        kind: 'local',
        type: 'file',
        storagePath: appConfig.files.storagePath,
        serverRoute: {
          path: '/files',
        },
        generateUrl: (path) => `/files${path}`,
      },
      images: {
        kind: 'local',
        type: 'image',
        storagePath: appConfig.images.storagePath,
        serverRoute: {
          path: '/images',
        },
        generateUrl: (path) => `/images${path}`,
      },
    },
    graphql: {
      apolloConfig: {
        cache: new InMemoryLRUCache({
          // ~100MiB
          maxSize: Math.pow(2, 20) * envVar.memoryCacheSize,
          // 5 minutes (in milliseconds)
          ttl: envVar.memoryCacheTtl,
        }),
      },
    },
    server: {
      healthCheck: {
        path: '/health_check',
        data: { status: 'healthy' },
      },
      extendExpressApp: (app, commonContext) => {
        const corsOpts = {
          origin: envVar.cors.allowOrigins,
        }
        const corsMiddleware = cors(corsOpts)
        app.use('*', corsMiddleware)

        // Check if the request is sent by an authenticated user
        const authenticationMw = async (
          req: Request,
          res: Response,
          next: NextFunction
        ) => {
          const context = await commonContext.withRequest(req, res)

          // User has been logged in
          if (context?.session?.data?.role) {
            return next()
          }

          // Otherwise, redirect them to login page
          res.redirect('/signin')
        }

        // ThreeJS router
        app.use(
          '/three',
          // Serve static files, including js, css and html
          // BTW, the reason we use `process.cwd()` rather than `__dirname`
          // is because `__dirname` won't return the correct absolute path;
          // it return a wrong relative path `../..`.
          // I think it is a bug for `@keystone/core`.
          express.static(path.resolve(process.cwd(), './public/three'))
        )

        app.get(
          '/demo/scrollable-videos/:id',
          authenticationMw,
          async (req, res) => {
            const itemId = req.params.id

            const context = await commonContext.withRequest(req, res)
            const item = await context.query.ScrollableVideo.findOne({
              where: { id: itemId },
              query: 'embedCode',
            })

            if (!item) {
              return res
                .status(404)
                .send(`ScrollableVideo ${itemId} is not found`)
            }

            res.send(
              `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style> * { box-sizing: border-box; } body { margin:0; } </style></head><body>${item?.embedCode}</body></html>`
            )
          }
        )
      },
    },
  })
)
