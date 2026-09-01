import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        // In our custom flow, the OTP was already verified by the API route.
        // We only call this authorize function from the client AFTER OTP verification succeeds.
        if (credentials.role === 'admin') {
          return {
            id: credentials.email as string,
            email: credentials.email as string,
            name: 'Admin',
            role: 'admin',
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
