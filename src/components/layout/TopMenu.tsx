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
  useTheme,
} from '@mui/material';
import {
  DiamondOutlined,
  Person,
  Logout,
  Menu as MenuIcon,
  Close,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faHistory } from '@fortawesome/free-solid-svg-icons';
import { useAuth, useBreakpoints } from '@/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TopMenu() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  const router = useRouter();
  const { isMobile } = useBreakpoints();
  const theme = useTheme();

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

  const handleSignIn = async () => {
    await signIn('discord');
  };

  const handleProfileClick = () => {
    handleUserMenuClose();
    if (user?.id) {
      router.push(`/user/${user.id}`);
    }
  };

  const navigationItems = [
    { label: 'Home', href: '/', icon: faHome },
    {
      label: 'Matches',
      href: user?.id ? `/user/${user.id}` : '/',
      icon: faHistory,
    },
  ];

  return (
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
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
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
              {navigationItems.map(item => (
                <Button
                  key={item.href}
                  component={Link}
                  href={item.href}
                  startIcon={<FontAwesomeIcon icon={item.icon} />}
                  sx={{
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 0, 128, 0.1)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
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
              onClick={handleSignIn}
              sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: theme.palette.background.default,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`,
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
              {navigationItems.map(item => (
                <Button
                  key={item.href}
                  component={Link}
                  href={item.href}
                  startIcon={<FontAwesomeIcon icon={item.icon} />}
                  fullWidth
                  sx={{
                    justifyContent: 'flex-start',
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 0, 128, 0.1)',
                    },
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Box>
        )}
      </Container>
    </AppBar>
  );
}
