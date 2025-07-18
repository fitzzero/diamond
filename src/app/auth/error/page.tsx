'use client';

import { Suspense, useState, useEffect } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
} from '@mui/material';
import { MainLayout } from '@/components/layout';
import Link from 'next/link';

function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    searchParams.then(params => setError(params.error));
  }, [searchParams]);

  const getErrorMessage = (errorType?: string) => {
    switch (errorType) {
      case 'AccessDenied':
        return 'Access was denied. You may not have permission to sign in.';
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An unknown error occurred during authentication.';
    }
  };

  return (
    <MainLayout title="Authentication Error">
      <Stack spacing={3} alignItems="center" sx={{ py: 8 }}>
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Typography variant="h5" color="error">
                Authentication Error
              </Typography>

              <Alert severity="error" sx={{ width: '100%' }}>
                {getErrorMessage(error)}
              </Alert>

              {error && (
                <Typography variant="body2" color="text.secondary">
                  Error code: {error}
                </Typography>
              )}

              <Stack direction="row" spacing={2}>
                <Button component={Link} href="/" variant="contained">
                  Go Home
                </Button>
                <Button
                  component={Link}
                  href="/api/auth/signin"
                  variant="outlined"
                >
                  Try Again
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </MainLayout>
  );
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent searchParams={searchParams} />
    </Suspense>
  );
}
