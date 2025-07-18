'use client';

import { useEffect, useState } from 'react';
import { Typography, Paper, Box, Button } from '@mui/material';
import { MainLayout } from '@/components/layout';
import {
  testDiamondSystem,
  testCoordinateExamples,
} from '@/lib/game/test-diamond-system';

export default function TestDiamondPage() {
  const [testOutput, setTestOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const runTests = () => {
    setIsRunning(true);
    setTestOutput('Running Diamond Chess System Tests...\n\n');

    // Capture console output
    const originalLog = console.log;
    const originalError = console.error;
    let output = '';

    console.log = (...args) => {
      output += args.join(' ') + '\n';
      originalLog(...args);
    };

    console.error = (...args) => {
      output += 'ERROR: ' + args.join(' ') + '\n';
      originalError(...args);
    };

    try {
      testDiamondSystem();
      output += '\n' + '='.repeat(50) + '\n\n';
      testCoordinateExamples();
    } catch (error) {
      output += `\nERROR: ${error}\n`;
    } finally {
      // Restore console
      console.log = originalLog;
      console.error = originalError;

      setTestOutput(output);
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Auto-run tests on page load
    runTests();
  }, []);

  return (
    <MainLayout title="Diamond System Test">
      <Typography variant="h3" component="h1" gutterBottom align="center">
        🔬 Diamond Chess System Tests
      </Typography>

      <Typography
        variant="subtitle1"
        gutterBottom
        align="center"
        color="text.secondary"
      >
        Testing the core game engine: coordinate system, board setup, and piece
        movement
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={runTests}
          disabled={isRunning}
          size="large"
        >
          {isRunning ? 'Running Tests...' : 'Run Tests Again'}
        </Button>
      </Box>

      <Paper sx={{ p: 3, bgcolor: 'grey.900', color: 'grey.100' }}>
        <Typography variant="h6" gutterBottom>
          Test Results:
        </Typography>
        <Box
          component="pre"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '70vh',
            overflow: 'auto',
          }}
        >
          {testOutput || 'No test output yet...'}
        </Box>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          What This Tests:
        </Typography>
        <Typography component="div">
          <ul>
            <li>
              <strong>Coordinate System:</strong> Conversion between standard
              chess coordinates (a1-h8) and diamond coordinates
            </li>
            <li>
              <strong>Board Setup:</strong> Proper placement of all 32 pieces in
              starting positions
            </li>
            <li>
              <strong>Pawn Movement:</strong> Unique Diamond Chess pawn
              mechanics (White: NW/NE move, N capture)
            </li>
            <li>
              <strong>Visual Display:</strong> Text representation of the
              diamond board layout
            </li>
          </ul>
        </Typography>
      </Box>
    </MainLayout>
  );
}
