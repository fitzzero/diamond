'use client';

import { ReactNode, useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  DiamondOutlined,
  Person,
  Logout,
  Home,
  PlayArrow,
  History,
  Menu as MenuIcon,
  Close,
} from '@mui/icons-material';
import { useAuth, useBreakpoints } from '@/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  showBackground?: boolean;
}

export default function MainLayout({
  children,
  title,
  showBackground = true,
}: MainLayoutProps) {
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const { isMobile } = useBreakpoints();

  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleSignOut = async () => {
    handleUserMenuClose();
    await signOut();
    router.push('/');
  };

  const handleProfileClick = () => {
    handleUserMenuClose();
    if (user?.id) {
      router.push(`/user/${user.id}`);
    }
  };

  const navigationItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Play', href: '/lobby', icon: PlayArrow },
    { label: 'Matches', href: '/matches', icon: History },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* Top Navigation */}
      <AppBar position="fixed" elevation={0}>
        <Container maxWidth="xl">
          <Toolbar sx={{ px: { xs: 0, sm: 2 } }}>
            {/* Logo & Brand */}
            <Box
              component={Link}
              href="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                mr: 4,
              }}
            >
              <DiamondOutlined
                sx={{
                  fontSize: 32,
                  mr: 1,
                  transform: 'rotate(45deg)',
                  color: 'primary.main',
                }}
              />
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #f5f5dc, #cd853f)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Diamond Chess
              </Typography>
            </Box>

            {/* Desktop Navigation */}
            {!isMobile && isAuthenticated && (
              <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
                {navigationItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.href}
                      component={Link}
                      href={item.href}
                      startIcon={<Icon />}
                      sx={{
                        color: 'text.primary',
                        '&:hover': {
                          backgroundColor: 'rgba(245, 245, 220, 0.1)',
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>
            )}

            <Box sx={{ flexGrow: 1 }} />

            {/* User Menu */}
            {isAuthenticated && user ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {!isMobile && (
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ mr: 2 }}
                  >
                    <Typography variant="body2" color="text.primary">
                      {user.name}
                    </Typography>
                    <Chip
                      label="Online"
                      size="small"
                      color="success"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </Stack>
                )}

                <IconButton
                  size="large"
                  onClick={handleUserMenuOpen}
                  sx={{ p: 0 }}
                >
                  <Avatar
                    src={user.image || undefined}
                    sx={{
                      width: 40,
                      height: 40,
                      border: '2px solid',
                      borderColor: 'primary.main',
                    }}
                  >
                    {user.name?.[0]?.toUpperCase()}
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  onClick={handleUserMenuClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                      mt: 1.5,
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={handleProfileClick}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Profile</ListItemText>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleSignOut}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Sign Out</ListItemText>
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Button
                variant="contained"
                startIcon={<Person />}
                onClick={() => router.push('/')}
                sx={{
                  background: 'linear-gradient(45deg, #f5f5dc, #cd853f)',
                  color: '#1a1a1a',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #fffef7, #deb887)',
                  },
                }}
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            {isMobile && isAuthenticated && (
              <IconButton
                color="inherit"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                sx={{ ml: 1 }}
              >
                {mobileMenuOpen ? <Close /> : <MenuIcon />}
              </IconButton>
            )}
          </Toolbar>

          {/* Mobile Navigation */}
          {isMobile && isAuthenticated && mobileMenuOpen && (
            <Box sx={{ pb: 2 }}>
              <Divider sx={{ mb: 1 }} />
              <Stack spacing={1}>
                {navigationItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.href}
                      component={Link}
                      href={item.href}
                      startIcon={<Icon />}
                      fullWidth
                      sx={{
                        justifyContent: 'flex-start',
                        color: 'text.primary',
                        '&:hover': {
                          backgroundColor: 'rgba(245, 245, 220, 0.1)',
                        },
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Container>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '80px',
          ...(showBackground && {
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            minHeight: '100vh',
          }),
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            overflow: 'hidden',
          }}
        >
          {title && (
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                textAlign: 'center',
                py: 2,
              }}
            >
              {title}
            </Typography>
          )}
          {children}
        </Container>
      </Box>
    </Box>
  );
}
