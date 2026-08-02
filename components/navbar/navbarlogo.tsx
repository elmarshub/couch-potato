"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const NavbarLogo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <motion.span
        className="font-logo text-2xl md:text-3xl tracking-wide uppercase text-[#E50914]"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        Couch Potato
      </motion.span>
    </Link>
  );
};

export default NavbarLogo;
