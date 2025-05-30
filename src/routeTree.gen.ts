/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as AuthorizeImport } from './routes/_authorize'
import { Route as AppImport } from './routes/_app'
import { Route as AuthorizeSignUpImport } from './routes/_authorize/sign-up'
import { Route as AuthorizeSignInImport } from './routes/_authorize/sign-in'
import { Route as AuthorizeForgotPasswordImport } from './routes/_authorize/forgot-password'
import { Route as AppRoomIndexImport } from './routes/_app/room/index'
import { Route as AppRoomRoomIdImport } from './routes/_app/room/$roomId'

// Create/Update Routes

const AuthorizeRoute = AuthorizeImport.update({
  id: '/_authorize',
  getParentRoute: () => rootRoute,
} as any)

const AppRoute = AppImport.update({
  id: '/_app',
  getParentRoute: () => rootRoute,
} as any)

const AuthorizeSignUpRoute = AuthorizeSignUpImport.update({
  id: '/sign-up',
  path: '/sign-up',
  getParentRoute: () => AuthorizeRoute,
} as any)

const AuthorizeSignInRoute = AuthorizeSignInImport.update({
  id: '/sign-in',
  path: '/sign-in',
  getParentRoute: () => AuthorizeRoute,
} as any)

const AuthorizeForgotPasswordRoute = AuthorizeForgotPasswordImport.update({
  id: '/forgot-password',
  path: '/forgot-password',
  getParentRoute: () => AuthorizeRoute,
} as any)

const AppRoomIndexRoute = AppRoomIndexImport.update({
  id: '/room/',
  path: '/room/',
  getParentRoute: () => AppRoute,
} as any)

const AppRoomRoomIdRoute = AppRoomRoomIdImport.update({
  id: '/room/$roomId',
  path: '/room/$roomId',
  getParentRoute: () => AppRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_app': {
      id: '/_app'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AppImport
      parentRoute: typeof rootRoute
    }
    '/_authorize': {
      id: '/_authorize'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthorizeImport
      parentRoute: typeof rootRoute
    }
    '/_authorize/forgot-password': {
      id: '/_authorize/forgot-password'
      path: '/forgot-password'
      fullPath: '/forgot-password'
      preLoaderRoute: typeof AuthorizeForgotPasswordImport
      parentRoute: typeof AuthorizeImport
    }
    '/_authorize/sign-in': {
      id: '/_authorize/sign-in'
      path: '/sign-in'
      fullPath: '/sign-in'
      preLoaderRoute: typeof AuthorizeSignInImport
      parentRoute: typeof AuthorizeImport
    }
    '/_authorize/sign-up': {
      id: '/_authorize/sign-up'
      path: '/sign-up'
      fullPath: '/sign-up'
      preLoaderRoute: typeof AuthorizeSignUpImport
      parentRoute: typeof AuthorizeImport
    }
    '/_app/room/$roomId': {
      id: '/_app/room/$roomId'
      path: '/room/$roomId'
      fullPath: '/room/$roomId'
      preLoaderRoute: typeof AppRoomRoomIdImport
      parentRoute: typeof AppImport
    }
    '/_app/room/': {
      id: '/_app/room/'
      path: '/room'
      fullPath: '/room'
      preLoaderRoute: typeof AppRoomIndexImport
      parentRoute: typeof AppImport
    }
  }
}

// Create and export the route tree

interface AppRouteChildren {
  AppRoomRoomIdRoute: typeof AppRoomRoomIdRoute
  AppRoomIndexRoute: typeof AppRoomIndexRoute
}

const AppRouteChildren: AppRouteChildren = {
  AppRoomRoomIdRoute: AppRoomRoomIdRoute,
  AppRoomIndexRoute: AppRoomIndexRoute,
}

const AppRouteWithChildren = AppRoute._addFileChildren(AppRouteChildren)

interface AuthorizeRouteChildren {
  AuthorizeForgotPasswordRoute: typeof AuthorizeForgotPasswordRoute
  AuthorizeSignInRoute: typeof AuthorizeSignInRoute
  AuthorizeSignUpRoute: typeof AuthorizeSignUpRoute
}

const AuthorizeRouteChildren: AuthorizeRouteChildren = {
  AuthorizeForgotPasswordRoute: AuthorizeForgotPasswordRoute,
  AuthorizeSignInRoute: AuthorizeSignInRoute,
  AuthorizeSignUpRoute: AuthorizeSignUpRoute,
}

const AuthorizeRouteWithChildren = AuthorizeRoute._addFileChildren(
  AuthorizeRouteChildren,
)

export interface FileRoutesByFullPath {
  '': typeof AuthorizeRouteWithChildren
  '/forgot-password': typeof AuthorizeForgotPasswordRoute
  '/sign-in': typeof AuthorizeSignInRoute
  '/sign-up': typeof AuthorizeSignUpRoute
  '/room/$roomId': typeof AppRoomRoomIdRoute
  '/room': typeof AppRoomIndexRoute
}

export interface FileRoutesByTo {
  '': typeof AuthorizeRouteWithChildren
  '/forgot-password': typeof AuthorizeForgotPasswordRoute
  '/sign-in': typeof AuthorizeSignInRoute
  '/sign-up': typeof AuthorizeSignUpRoute
  '/room/$roomId': typeof AppRoomRoomIdRoute
  '/room': typeof AppRoomIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/_app': typeof AppRouteWithChildren
  '/_authorize': typeof AuthorizeRouteWithChildren
  '/_authorize/forgot-password': typeof AuthorizeForgotPasswordRoute
  '/_authorize/sign-in': typeof AuthorizeSignInRoute
  '/_authorize/sign-up': typeof AuthorizeSignUpRoute
  '/_app/room/$roomId': typeof AppRoomRoomIdRoute
  '/_app/room/': typeof AppRoomIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | ''
    | '/forgot-password'
    | '/sign-in'
    | '/sign-up'
    | '/room/$roomId'
    | '/room'
  fileRoutesByTo: FileRoutesByTo
  to:
    | ''
    | '/forgot-password'
    | '/sign-in'
    | '/sign-up'
    | '/room/$roomId'
    | '/room'
  id:
    | '__root__'
    | '/_app'
    | '/_authorize'
    | '/_authorize/forgot-password'
    | '/_authorize/sign-in'
    | '/_authorize/sign-up'
    | '/_app/room/$roomId'
    | '/_app/room/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  AppRoute: typeof AppRouteWithChildren
  AuthorizeRoute: typeof AuthorizeRouteWithChildren
}

const rootRouteChildren: RootRouteChildren = {
  AppRoute: AppRouteWithChildren,
  AuthorizeRoute: AuthorizeRouteWithChildren,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/_app",
        "/_authorize"
      ]
    },
    "/_app": {
      "filePath": "_app.tsx",
      "children": [
        "/_app/room/$roomId",
        "/_app/room/"
      ]
    },
    "/_authorize": {
      "filePath": "_authorize.tsx",
      "children": [
        "/_authorize/forgot-password",
        "/_authorize/sign-in",
        "/_authorize/sign-up"
      ]
    },
    "/_authorize/forgot-password": {
      "filePath": "_authorize/forgot-password.tsx",
      "parent": "/_authorize"
    },
    "/_authorize/sign-in": {
      "filePath": "_authorize/sign-in.tsx",
      "parent": "/_authorize"
    },
    "/_authorize/sign-up": {
      "filePath": "_authorize/sign-up.tsx",
      "parent": "/_authorize"
    },
    "/_app/room/$roomId": {
      "filePath": "_app/room/$roomId.tsx",
      "parent": "/_app"
    },
    "/_app/room/": {
      "filePath": "_app/room/index.tsx",
      "parent": "/_app"
    }
  }
}
ROUTE_MANIFEST_END */
