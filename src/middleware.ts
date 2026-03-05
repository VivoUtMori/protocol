import { withAuth } from "next-auth/middleware"

export default withAuth({
    pages: {
        signIn: "/login",
    },
})

export const config = {
    // Protect all routes except the login page, api/auth, and api/register
    matcher: [
        "/((?!login|api/auth|api/register|_next/static|_next/image|favicon.ico).*)",
    ]
}
