'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { NavCategory } from '@/data/navigation';

interface MegaMenuProps {
  category: NavCategory;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onNavigate: () => void;
}

const EASE = [0.25, 0.1, 0.25, 1] as const;

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={cn('h-3 w-3', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

export function MegaMenu({ category, onMouseEnter, onMouseLeave, onNavigate }: MegaMenuProps) {
  return (
    <motion.div
      key={category.label}
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: EASE }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute inset-x-0 top-full z-[60] pt-4"
      aria-label={`${category.label} subcategories`}
    >
      <div className="glass-cream overflow-hidden rounded-2xl shadow-[0_36px_70px_-28px_rgba(0,0,0,0.95)]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-cinnamon to-transparent" />

        <div className="grid gap-8 p-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-10">
          {/* Subcategory links */}
          <div>
            <div className="flex items-baseline justify-between gap-4 border-b border-bone/10 pb-4">
              <div className="flex items-baseline gap-3">
                <h3 className="font-display text-2xl font-medium text-porcelain">{category.label}</h3>
                {category.accent && (
                  <span className="rounded-full border border-cinnamon/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-clay">
                    Extra Savings
                  </span>
                )}
              </div>
              <Link
                href={category.href}
                onClick={onNavigate}
                className="group/view text-[11px] font-medium uppercase tracking-[0.18em] text-clay transition-colors hover:text-porcelain"
              >
                View All
                <ArrowIcon className="ml-1.5 inline-block -translate-y-px transition-transform duration-300 group-hover/view:translate-x-1" />
              </Link>
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-x-10 gap-y-1 sm:grid-cols-3">
              {category.subcategories.map((sub, index) => (
                <motion.li
                  key={sub.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 + index * 0.035, duration: 0.32, ease: EASE }}
                >
                  <Link
                    href={sub.href}
                    onClick={onNavigate}
                    className="group/sub flex items-center justify-between gap-3 border-b border-transparent py-2.5 transition-colors duration-300 hover:border-cinnamon/50"
                  >
                    <span className="text-[13px] tracking-[0.04em] text-bone/80 transition-colors duration-300 group-hover/sub:text-porcelain">
                      {sub.label}
                    </span>
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-bone/15 text-bone opacity-0 transition-all duration-300 group-hover/sub:border-cinnamon group-hover/sub:bg-cinnamon group-hover/sub:text-onyx group-hover/sub:opacity-100">
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m-7-7l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Featured editorial image */}
          <div className="hidden lg:block">
            <Link
              href={category.href}
              onClick={onNavigate}
              className="group/img relative block h-full min-h-[260px] overflow-hidden rounded-xl"
            >
              <Image
                src={category.image}
                alt={category.label}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover/img:scale-105"
                sizes="240px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-clay">Explore</p>
                <p className="mt-1 font-display text-2xl font-light text-porcelain">{category.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-bone/70">{category.tagline}</p>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
                  Shop Collection
                  <svg
                    className="h-3 w-3 transition-transform duration-300 group-hover/img:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
