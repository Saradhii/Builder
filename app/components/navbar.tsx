"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Binary } from "@/components/animate-ui/icons/binary";
import { Hammer } from "@/components/animate-ui/icons/hammer";
import { SquareKanban } from "@/components/animate-ui/icons/square-kanban";
import { Orbit } from "@/components/animate-ui/icons/orbit";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";

export function Navbar() {
  const pathname = usePathname();
  const isDocsPage = pathname.startsWith("/docs");
  const navHref = isDocsPage ? "/" : "/docs";
  const navLabel = isDocsPage ? "BUILD" : "DOCS";
  const NavIcon = isDocsPage ? Hammer : Binary;

  return (
    <header className="relative z-50">
      <div className="max-w-3xl mx-auto px-4 xl:px-0 py-3">
        <div className="bg-background/85 backdrop-blur-md flex items-center justify-between gap-x-4 rounded-3xl border border-input/80 py-2.5 pl-5 pr-2.5">
          <div className="flex items-center gap-x-10">
            <Link href="/" title="Home" className="flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-7 sm:h-7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6.336 8.919v6.162l5.335-3.083L6.337 8.92z" fill="#1C54E3"/>
                <path d="M21.394 5.288s-.006-.006-.01-.006L17.01 2.754 6.336 8.92l5.335 3.082 9.701-5.6.016-.01a.635.635 0 00.006-1.1v-.003z" fill="#AA9AFF"/>
                <path d="M21.71 12.465a.62.62 0 00-.316.085s-.006 0-.009.003l-4.375 2.528 5.05 2.915h.006a2.06 2.06 0 00.28-1.04v-3.855a.637.637 0 00-.636-.636z" fill="#00EAD1"/>
                <path d="M22.06 17.996l-5.05-2.915L6.34 21.242l4.27 2.465s.016.006.022.012a2.102 2.102 0 002.093 0c.006-.003.016-.006.022-.012l8.538-4.93c.003 0 .006-.003.01-.006.321-.183.589-.45.775-.772h-.006l-.004-.003z" fill="#00CEC9"/>
                <path d="M11.672 11.998l-5.336 3.083-1.444.832-3.605 2.083H1.28c.173.303.416.555.709.738l.078.044.016.01.02.012 4.232 2.442 10.671-6.161-5.335-3.082z" fill="#00EAD1"/>
                <path d="M12.74.29c-.1-.06-.208-.107-.315-.148-.02-.006-.038-.016-.057-.022a2.121 2.121 0 00-.7-.12c-.233 0-.457.038-.668.11l-.031.01a2.196 2.196 0 00-.372.17L2.068 5.222s-.003 0-.006.003c-.324.183-.592.451-.781.773h.006l5.049 2.918L17.01 2.758 12.74.29z" fill="#7347FF"/>
                <path d="M1.287 6.001H1.28A2.06 2.06 0 001 7.041v9.915c0 .378.1.735.28 1.043h.007l5.049-2.918V8.919l-5.05-2.918z" fill="#0423DA"/>
              </svg>
              <span className="font-bold text-sm sm:text-base tracking-tight text-foreground">
                BLDR
              </span>
            </Link>
            <span className="hidden h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 lg:block"></span>
          </div>
          <nav className="block">
            <ul className="flex items-center gap-1">
              <li>
                <AnimateIcon animateOnHover asChild>
                  <Link
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 transition hover:text-neutral-600 dark:hover:text-neutral-400"
                    href={navHref}
                  >
                    <NavIcon size={20} />
                    {navLabel}
                  </Link>
                </AnimateIcon>
              </li>
              <li>
                <AnimateIcon animateOnHover asChild>
                  <Link
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 transition hover:text-neutral-600 dark:hover:text-neutral-400"
                    href="/builds"
                  >
                    <SquareKanban size={20} />
                    BUILDS
                  </Link>
                </AnimateIcon>
              </li>
              <li>
                <AnimateIcon animateOnHover asChild>
                  <Link
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 transition hover:text-neutral-600 dark:hover:text-neutral-400"
                    href="/templates"
                  >
                    <Orbit size={20} />
                    TEMPLATES
                  </Link>
                </AnimateIcon>
              </li>
            </ul>
          </nav>
          <div className="flex items-center gap-x-4">
            <span className="hidden h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 lg:block"></span>
            <div className="flex items-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
