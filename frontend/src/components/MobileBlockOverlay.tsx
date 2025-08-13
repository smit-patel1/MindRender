import React from 'react';

export default function MobileBlockOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="mb-4 text-2xl font-bold">Mobile Version Coming Soon</h1>
      <p className="px-4 text-center max-w-md">
        We’re actively building our mobile experience. Please try MindRender on desktop for now.
      </p>
    </div>
  );
}
