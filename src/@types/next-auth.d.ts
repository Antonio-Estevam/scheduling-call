import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    username: string
    name: string
    email: string
    avatar_url: string
  }
}
