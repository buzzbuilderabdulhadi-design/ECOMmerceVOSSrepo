'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Rating } from '@/components/ui/Rating';

export interface ReviewData {
  id: string;
  customerName: string;
  country?: string;
  isVerifiedPurchase: boolean;
  rating: number;
  title?: string;
  text: string;
  images?: string[];
  date: string;
  helpfulCount: number;
}

interface ReviewCardProps {
  review: ReviewData;
  onHelpful?: (reviewId: string) => void;
  className?: string;
}

export function ReviewCard({ review, onHelpful, className }: ReviewCardProps) {
  const {
    id,
    customerName,
    country,
    isVerifiedPurchase,
    rating,
    title,
    text,
    images,
    date,
    helpfulCount,
  } = review;

  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const initials = customerName
    .split(' ')
    .map((name) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn('rounded-xl border border-gray-100 bg-white p-5 transition-all duration-200 hover:border-gray-200 hover:shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{customerName}</span>
              {isVerifiedPurchase && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verified Purchase
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <Rating value={rating} size="sm" />
              {country && (
                <span className="text-xs text-gray-400">{country}</span>
              )}
              <span className="text-xs text-gray-400">{formatDate(date)}</span>
            </div>
          </div>
        </div>
      </div>

      {title && (
        <h4 className="mt-3 text-sm font-semibold text-gray-900">{title}</h4>
      )}

      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{text}</p>

      {images && images.length > 0 && (
        <div className="mt-3 flex gap-2">
          {images.slice(0, 4).map((image, index) => (
            <div key={index} className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
              <Image
                src={image}
                alt={`Review image ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          ))}
          {images.length > 4 && (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400">
              +{images.length - 4}
            </div>
          )}
        </div>
      )}

      {onHelpful && (
        <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
          <span className="text-xs text-gray-400">Was this helpful?</span>
          <button
            type="button"
            onClick={() => onHelpful(id)}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            Helpful ({helpfulCount})
          </button>
        </div>
      )}
    </div>
  );
}
