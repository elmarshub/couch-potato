"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, User, LogOut, Bookmark, Loader2 } from "lucide-react";
import { navLinks } from "./navbarLinks";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuthContext } from "@/providers/auth-provider";
import type { AuthUser } from "@/features/auth/types";
import { getAvatarUrl, getInitials } from "@/lib/avatar";
import { routes } from "@/lib/routes";

interface MobileMenuProps {
  isOpen: boolean;
  pathname: string;
  onClose: () => void;
  user: AuthUser | null;
  isLoading: boolean;
}

const MobileMenu = ({
  isOpen,
  pathname,
  onClose,
  user,
}: MobileMenuProps) => {
  const { signOut, isSigningOut } = useAuthContext();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: -400, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: {
                type: "spring",
                damping: 20,
                stiffness: 300,
                mass: 0.8,
              },
            }}
            exit={{
              y: -400,
              opacity: 0,
              transition: {
                duration: 0.3,
                ease: "easeInOut",
              },
            }}
            className="fixed left-0 right-0 top-[72px] z-40 md:hidden"
          >
            <div className="mx-4 mt-2 rounded-2xl bg-gradient-to-br from-[#1a1a1a]/95 via-[#141414]/95 to-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-purple-600/5 pointer-events-none" />

              <div className="relative px-4 py-6 space-y-6">
                {user && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        delay: 0.1,
                        duration: 0.3,
                      },
                    }}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-600/20 to-red-800/20 rounded-xl border border-red-500/20"
                  >
                    <Avatar className="">
                      <AvatarImage
                        src={user.avatarUrl ?? getAvatarUrl(user.email, user.name, 64)}
                        alt=""
                      />
                      <AvatarFallback>
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {user.name}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {user.email}
                      </p>
                    </div>
                  </motion.div>
                )}

                <nav>
                  <ul className="space-y-2">
                    {navLinks.map((link, index) => (
                      <motion.li
                        key={link.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          transition: {
                            delay: (user ? 0.2 : 0.1) + index * 0.1,
                            duration: 0.3,
                            ease: "easeOut",
                          },
                        }}
                        exit={{
                          opacity: 0,
                          x: -20,
                          transition: {
                            duration: 0.2,
                          },
                        }}
                      >
                        <Link
                          href={link.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200",
                            pathname === link.href
                              ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/20"
                              : "text-gray-300 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <motion.span
                            animate={
                              pathname === link.href
                                ? {
                                    scale: [1, 1.2, 1],
                                    transition: {
                                      duration: 0.3,
                                    },
                                  }
                                : {}
                            }
                          >
                            {link.icon}
                          </motion.span>
                          {link.name}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </nav>

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{
                    scaleX: 1,
                    transition: {
                      delay: user ? 0.5 : 0.4,
                      duration: 0.4,
                    },
                  }}
                  className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent origin-left"
                />

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: user ? 0.6 : 0.5,
                      duration: 0.3,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    y: 20,
                    transition: {
                      duration: 0.2,
                    },
                  }}
                  className="space-y-3"
                >
                  <Link href="/search" onClick={onClose}>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 mb-3 border-white/20 hover:bg-white/10 text-white hover:border-white/30 transition-all rounded-xl py-6"
                      >
                        <Search className="w-5 h-5" />
                        Search Movies & Shows
                      </Button>
                    </motion.div>
                  </Link>

                  {user ? (
                    <>
                      <Link href={routes.library} onClick={onClose}>
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-3 border-white/20 mb-3 hover:bg-white/10 text-white hover:border-white/30 transition-all rounded-xl py-6"
                          >
                            <Bookmark className="w-5 h-5" />
                            My Library
                          </Button>
                        </motion.div>
                      </Link>

                      <Link href="/profile" onClick={onClose}>
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-3 border-white/20 mb-3 hover:bg-white/10 text-white hover:border-white/30 transition-all rounded-xl py-6"
                          >
                            <User className="w-5 h-5" />
                            Profile
                          </Button>
                        </motion.div>
                      </Link>

                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => {
                            onClose();
                            signOut();
                          }}
                          disabled={isSigningOut}
                          className="w-full justify-start gap-3 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/30 hover:border-red-500/50 transition-all rounded-xl py-6 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSigningOut ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <LogOut className="w-5 h-5" />
                          )}
                          {isSigningOut ? "Signing out..." : "Log Out"}
                        </Button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <Link href="/signup" onClick={onClose}>
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Button className="w-full bg-gradient-to-r mb-3 from-red-600 to-red-700 text-white font-semibold hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-600/20 transition-all rounded-xl py-6">
                            Sign Up
                          </Button>
                        </motion.div>
                      </Link>

                      <Link href="/login" onClick={onClose}>
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            className="w-full border-2 border-white/20 hover:bg-white/10 text-white hover:border-white/30 transition-all rounded-xl py-6"
                          >
                            Login
                          </Button>
                        </motion.div>
                      </Link>
                    </>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
