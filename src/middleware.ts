import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workers/:path*",
    "/attendance/:path*",
    "/calendar/:path*",
    "/salary/:path*",
    "/leave/:path*",
    "/holidays/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/expenses/:path*",
    "/finance/:path*",
  ],
};

