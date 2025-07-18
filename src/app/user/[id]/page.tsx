'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
// import Grid from '@mui/material/Grid';
import {
  Person,
  Edit,
  TrendingUp,
  History,
  EmojiEvents,
  PlayArrow,
  Visibility,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useUserMatches } from '@/hooks/useGame';
import { MainLayout } from '@/components/layout';
import Link from 'next/link';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const userId = params.id as string;

  const [activeTab, setActiveTab] = useState(0);
  const { matches: userMatches, isLoading: matchesLoading } = useUserMatches();

  const isOwnProfile = currentUser?.id === userId;

  // Calculate user statistics
  const userStats = useMemo(() => {
    if (!userMatches || userMatches.length === 0) {
      return {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        inProgress: 0,
        winRate: 0,
      };
    }

    const totalMatches = userMatches.length;
    const completedMatches = userMatches.filter(
      (match: any) => match.status === 'COMPLETED'
    );
    const inProgressMatches = userMatches.filter(
      (match: any) => match.status === 'IN_PROGRESS'
    );

    let wins = 0;
    let losses = 0;

    completedMatches.forEach((match: any) => {
      if (match.winnerId === userId) {
        wins++;
      } else if (match.winnerId) {
        losses++;
      }
      // Note: matches without winnerId are draws (not implemented yet)
    });

    const winRate =
      completedMatches.length > 0 ? (wins / completedMatches.length) * 100 : 0;

    return {
      totalMatches,
      wins,
      losses,
      inProgress: inProgressMatches.length,
      winRate: Math.round(winRate),
    };
  }, [userMatches, userId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'primary';
      case 'WAITING_FOR_PLAYER':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getMatchResult = (match: any) => {
    if (match.status !== 'COMPLETED') {
      return '-';
    }

    if (!match.winnerId) {
      return 'Draw';
    }

    return match.winnerId === userId ? 'Win' : 'Loss';
  };

  const getMatchResultColor = (match: any) => {
    const result = getMatchResult(match);
    switch (result) {
      case 'Win':
        return 'success';
      case 'Loss':
        return 'error';
      case 'Draw':
        return 'info';
      default:
        return 'default';
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <Alert severity="warning">
          You must be signed in to view user profiles.
        </Alert>
      </MainLayout>
    );
  }

  if (matchesLoading && isOwnProfile) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  // For now, we'll show the current user's profile
  // In a full implementation, we'd fetch the specific user's data
  const profileUser = currentUser; // TODO: Fetch specific user data

  if (!profileUser) {
    return (
      <MainLayout>
        <Alert severity="error">User not found.</Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ py: 4 }}>
        {/* Profile Header */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                src={profileUser.image || undefined}
                sx={{ width: 80, height: 80 }}
              >
                <Person sx={{ fontSize: 40 }} />
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" gutterBottom>
                  {profileUser.name || 'Anonymous Player'}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Diamond Chess Player
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Chip
                    icon={<EmojiEvents />}
                    label={`${userStats.wins} Wins`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    icon={<TrendingUp />}
                    label={`${userStats.winRate}% Win Rate`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<History />}
                    label={`${userStats.totalMatches} Total Matches`}
                    variant="outlined"
                  />
                </Stack>
              </Box>

              {isOwnProfile && (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => {
                    // TODO: Implement profile editing
                    alert('Profile editing coming soon!');
                  }}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
            mb: 4,
          }}
        >
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary.main">
                {userStats.totalMatches}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Matches
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">
                {userStats.wins}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Wins
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="error.main">
                {userStats.losses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Losses
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary.main">
                {userStats.winRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Win Rate
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Tabs Section */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Match History" icon={<History />} />
              <Tab label="Statistics" icon={<TrendingUp />} />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            {/* Match History */}
            {userMatches.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No matches found
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {isOwnProfile
                    ? 'Start playing to see your match history here!'
                    : "This player hasn't played any matches yet."}
                </Typography>
                {isOwnProfile && (
                  <Button
                    component={Link}
                    href="/"
                    variant="contained"
                    startIcon={<PlayArrow />}
                  >
                    Create Match
                  </Button>
                )}
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Match</TableCell>
                      <TableCell>Opponent</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Result</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userMatches.map((match: any) => {
                      const isPlayer1 = match.player1Id === userId;
                      const opponent = isPlayer1
                        ? match.player2
                        : match.player1;

                      return (
                        <TableRow key={match.id}>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              #{match.id.slice(-6)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {opponent ? (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Avatar
                                  src={opponent.image}
                                  sx={{ width: 24, height: 24 }}
                                >
                                  <Person sx={{ fontSize: 12 }} />
                                </Avatar>
                                {opponent.name || 'Anonymous'}
                              </Box>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Waiting for player...
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={match.status.replace('_', ' ')}
                              color={getMatchStatusColor(match.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getMatchResult(match)}
                              color={getMatchResultColor(match)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(match.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button
                              component={Link}
                              href={`/match/${match.id}`}
                              size="small"
                              startIcon={<Visibility />}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {/* Statistics */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3,
              }}
            >
              <Box>
                <Typography variant="h6" gutterBottom>
                  Performance Overview
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Matches Played
                    </Typography>
                    <Typography variant="h4">
                      {userStats.totalMatches}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Win/Loss Record
                    </Typography>
                    <Typography variant="h5">
                      {userStats.wins}W - {userStats.losses}L
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Current Win Rate
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {userStats.winRate}%
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Activity Status
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Matches in Progress
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {userStats.inProgress}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Member Since
                    </Typography>
                    <Typography variant="body1">
                      Recently {/* TODO: Get actual creation date */}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Last Active
                    </Typography>
                    <Typography variant="body1">
                      {/* TODO: Implement last activity tracking */}
                      Recently
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </TabPanel>
        </Card>
      </Box>
    </MainLayout>
  );
}
