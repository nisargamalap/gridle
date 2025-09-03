"use client"

import { signOut } from "next-auth/react"
import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  HiHome,
  HiClipboardList,
  HiDocumentText,
  HiUserGroup,
  HiCog,
  HiShieldCheck,
  HiChevronLeft,
  HiChevronRight,
  HiPlus,
  HiUserCircle,
} from "react-icons/hi"

// --- Icons ---
export const UserProfileIcon = () => <HiUserCircle className="w-8 h-8" aria-hidden="true" /> 
export const PlusIcon = () => <HiPlus className="w-8 h-8" aria-hidden="true" /> 
const AdminIcon = (props) => <HiShieldCheck className="w-6 h-6" {...props} aria-hidden="true" /> 
const ArrowIcon = ({ direction = "left" }) =>
  direction === "left" ? (
    <HiChevronLeft className="w-6 h-6 transition-transform duration-300" aria-hidden="true" />
  ) : (
    <HiChevronRight className="w-6 h-6 transition-transform duration-300" aria-hidden="true" />
  )
// --- End Icons ---

const sidebarNavItems = [
  {
    name: "Dashboard",
    icon: (props) => <HiHome className="w-6 h-6" {...props} aria-hidden="true" />,
    path: "/dashboard",
  }, 
  {
    name: "Tasks",
    icon: (props) => <HiClipboardList className="w-6 h-6" {...props} aria-hidden="true" />,
    path: "/tasks",
  }, 
  {
    name: "Notes",
    icon: (props) => <HiDocumentText className="w-6 h-6" {...props} aria-hidden="true" />,
    path: "/notes",
  }, 
  {
    name: "Groups",
    icon: (props) => <HiUserGroup className="w-6 h-6" {...props} aria-hidden="true" />,
    path: "/groups",
  }, 
  { name: "Settings", icon: (props) => <HiCog className="w-6 h-6" {...props} aria-hidden="true" />, path: "/settings" },
]

const ClientLayout = ({ children, isAdmin = false }) => {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded((prev) => !prev)
  }, [])

  const toggleProfileDropdown = useCallback(() => {
    setShowProfileDropdown((prev) => !prev)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await signOut({
        redirect: false,
        callbackUrl: "/signin",
      })
      router.push("/signin")
      router.refresh()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setShowProfileDropdown(false)
    }
  }, [router])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getCurrentPageTitle = useCallback(() => {
    const activeItem = sidebarNavItems.find((item) => pathname.startsWith(item.path))
    if (activeItem) return activeItem.name

    if (pathname.startsWith("/tasks/")) return "Task Details"
    if (pathname === "/signin") return "Sign In"
    if (pathname === "/signup") return "Sign Up"
    if (pathname === "/forgot-password") return "Forgot Password"
    if (pathname === "/reset-password") return "Reset Password"
    if (pathname === "/admin") return "Admin Panel"

    return "Gridle"
  }, [pathname])

  const pageTitle = getCurrentPageTitle()
  const authPaths = ["/", "/signin", "/signup", "/forgot-password", "/reset-password"]
  const showSidebarAndHeader = !authPaths.includes(pathname)

  return (
    <div className="flex h-screen font-sans bg-background text-foreground">
      {" "}
      {showSidebarAndHeader && (
        <aside
          className={` ${isSidebarExpanded ? "w-64 px-4" : "w-20 px-2"} bg-primary text-primary-foreground flex flex-col shadow-md transition-all duration-300 ease-in-out overflow-hidden`} // slightly softer card surface and consistent shadow
          aria-label="Sidebar"
        >
          <div
            className={`py-4 text-center border-b border-primary-foreground/15 ${isSidebarExpanded ? "mb-6" : "mb-2"}`}
          >
            {" "}
            
            <Link
              href="/dashboard"
              className="group block text-primary-foreground hover:text-accent transition-colors duration-200"
              aria-label="Dashboard"
            >
              <span className={`${isSidebarExpanded ? "text-2xl font-bold tracking-tight text-pretty" : "hidden"}`}>
                {" "}
              </span>
              <span className={`${isSidebarExpanded ? "hidden" : "text-lg font-extrabold"}`} aria-hidden="true">
                {" "}
              </span>
            </Link>
          </div>
          <nav className="flex-1" aria-label="Main navigation">
            {" "}
            <ul className="space-y-1" role="list">
              {sidebarNavItems.map((item) => {
                const active = pathname.startsWith(item.path)
                return (
                  <li key={item.name}>
                    <Link
                      href={item.path}
                      className={`relative flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200 ${active ? "bg-accent text-accent-foreground shadow-sm" : "text-primary-foreground/90 hover:bg-primary-foreground/10 hover:text-primary-foreground"} ${isSidebarExpanded ? "" : "justify-center"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary`} // improve focus-visible rings
                      aria-current={active ? "page" : undefined}
                    >
                      <item.icon className={`shrink-0 ${isSidebarExpanded ? "mr-3" : ""}`} />
                      
                      <span className={isSidebarExpanded ? "truncate" : "sr-only"}>
                        {" "}
                        {item.name}
                      </span>
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-accent-foreground/70"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  </li>
                )
              })}
              {isAdmin && (
                <>
                  <li
                    className={`border-t border-primary-foreground/10 ${isSidebarExpanded ? "mt-3 pt-3" : "mt-2 pt-2"}`}
                    aria-hidden="true"
                  />{" "}
                  <li>
                    {(() => {
                      const active = pathname.startsWith("/admin")
                      return (
                        <Link
                          href="/admin"
                          className={`relative flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200 ${active ? "bg-accent text-accent-foreground shadow-sm" : "text-primary-foreground/90 hover:bg-primary-foreground/10 hover:text-primary-foreground"} ${isSidebarExpanded ? "" : "justify-center"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary`} // improve focus-visible rings
                          aria-current={active ? "page" : undefined}
                        >
                          <AdminIcon className={isSidebarExpanded ? "mr-3" : ""} />
                          <span className={isSidebarExpanded ? "truncate" : "sr-only"}>Admin Panel</span>
                          {active && (
                            <span
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-accent-foreground/70"
                              aria-hidden="true"
                            />
                          )}
                        </Link>
                      )
                    })()}
                  </li>
                </>
              )}
            </ul>
          </nav>
        </aside>
      )}
      <main className="flex-1 flex flex-col bg-background">
        {showSidebarAndHeader && (
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/85 backdrop-blur-sm px-6 py-4 shadow-sm">
            {" "}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="inline-flex items-center justify-center rounded-full p-2 hover:bg-muted transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card" // improve focus-visible rings
                aria-label={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
              >
                <ArrowIcon direction={isSidebarExpanded ? "left" : "right"} />
              </button>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground text-balance">
                {" "}
                {pageTitle}
              </h1>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleProfileDropdown}
                className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground p-1.5 hover:bg-accent transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card" // improve focus-visible rings
                aria-label="User menu"
                aria-expanded={showProfileDropdown}
              >
                <UserProfileIcon />
              </button>
              {showProfileDropdown && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg z-20 overflow-hidden"
                  role="menu"
                  aria-label="User menu"
                >
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    onClick={() => setShowProfileDropdown(false)}
                    role="menuitem"
                  >
                    Edit Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                    role="menuitem"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </header>
        )}
        <section className="flex-1 overflow-y-auto p-4 md:p-6">{children}</section>
      </main>
    </div>
  )
}

export default ClientLayout
