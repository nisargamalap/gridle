import React from "react";

export const metadata = { title: "Reset Password" };

export default function ResetPasswordLayout({ children }) {
  // Standalone page, no ClientLayout or Providers wrapper
  return <>{children}</>;
}
