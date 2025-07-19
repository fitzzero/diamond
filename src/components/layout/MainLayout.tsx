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
  useTheme,
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
import TopMenu from './TopMenu';

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
      <TopMenu />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '80px',
          ...(showBackground && {
            background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
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
