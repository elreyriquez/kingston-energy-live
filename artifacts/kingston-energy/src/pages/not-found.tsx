import React from 'react';
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center p-8 border border-border rounded-xl bg-card shadow-2xl max-w-md">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">404 - Sector Not Found</h1>
        <p className="text-muted-foreground mb-6">The routing coordinates you requested are invalid or the sector is currently offline.</p>
        <Link href="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          Return to Hub
        </Link>
      </div>
    </div>
  );
}
