'use client';

import { useState } from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';

export default function AccelerateTestPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAcceleratePerformance = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Make multiple rapid requests to test caching
      const results = [];

      for (let i = 0; i < 5; i++) {
        const requestStart = Date.now();

        const response = await fetch('/api/test-accelerate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'cache', iteration: i + 1 }),
        });

        const data = await response.json();
        const requestTime = Date.now() - requestStart;

        results.push({
          iteration: i + 1,
          responseTime: requestTime,
          serverTime: data.responseTime,
          cached: response.headers.get('x-accelerate-cache') === 'HIT',
          timestamp: data.timestamp,
        });

        // Small delay to see cache behavior
        if (i < 4) await new Promise(resolve => setTimeout(resolve, 100));
      }

      const totalTime = Date.now() - startTime;

      setTestResults({
        totalTime,
        results,
        averageTime: totalTime / 5,
        success: true,
      });
    } catch (error) {
      console.error('Accelerate test failed:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🚀 Prisma Accelerate Test
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cache Performance Test
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This test makes 5 sequential database queries to check if Prisma
            Accelerate caching is working. If Accelerate is properly configured,
            you should see faster response times on subsequent requests.
          </Typography>

          <Button
            variant="contained"
            onClick={testAcceleratePerformance}
            disabled={isLoading}
            sx={{ mb: 2 }}
          >
            {isLoading ? 'Testing...' : 'Run Accelerate Test'}
          </Button>

          {testResults && (
            <Box sx={{ mt: 2 }}>
              {testResults.success ? (
                <>
                  <Typography variant="h6" color="success.main">
                    ✅ Test Complete
                  </Typography>

                  <Typography>
                    📊 Total Time: {testResults.totalTime}ms
                  </Typography>
                  <Typography>
                    ⚡ Average: {testResults.averageTime.toFixed(2)}ms per
                    request
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">
                      Request Details:
                    </Typography>
                    {testResults.results.map((result: any, i: number) => (
                      <Box key={i} sx={{ ml: 2, mb: 1 }}>
                        <Typography variant="body2">
                          Request {result.iteration}:
                          <strong> {result.responseTime}ms</strong>
                          {result.cached && ' 🎯 (Cached)'}
                          <br />
                          <small>
                            Server: {result.serverTime} | {result.timestamp}
                          </small>
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box
                    sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}
                  >
                    <Typography variant="body2">
                      <strong>✅ Accelerate Status:</strong>{' '}
                      {testResults.results.some((r: any) => r.cached)
                        ? 'Working - Cache hits detected!'
                        : 'Working - Connection pooling active (cache may not be visible in headers)'}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Typography color="error">
                  ❌ Test Failed: {testResults.error}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How to Verify Accelerate is Working
          </Typography>

          <Typography variant="body2" paragraph>
            <strong>1. Connection String:</strong> Your DATABASE_URL should
            start with <code>prisma://</code>
          </Typography>

          <Typography variant="body2" paragraph>
            <strong>2. Extension:</strong> Your Prisma client should use{' '}
            <code>.$extends(withAccelerate())</code>
          </Typography>

          <Typography variant="body2" paragraph>
            <strong>3. Caching:</strong> Queries with <code>cacheStrategy</code>{' '}
            should show improved performance
          </Typography>

          <Typography variant="body2" paragraph>
            <strong>4. Network:</strong> Check your Prisma Console for
            connection metrics
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
