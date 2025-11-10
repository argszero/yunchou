import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { ProblemCreation } from './components/ProblemCreation';
import { ProblemDetail } from './components/ProblemDetail';
import { DecisionFlow } from './components/DecisionFlow';

// 创建主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196F3', // 科技蓝
    },
    secondary: {
      main: '#4CAF50', // 成功绿
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          minHeight: '44px', // 移动端触摸友好
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontSize: '16px', // 防止iOS缩放
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: '44px',
          minHeight: '44px',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{
          flexGrow: 1,
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 顶部导航栏 - 移动端优化 */}
          <AppBar
            position="static"
            elevation={1}
            sx={{
              bgcolor: 'white',
              color: 'text.primary',
              borderBottom: 1,
              borderColor: 'divider'
            }}
          >
            <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' } }}>
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  flexGrow: 1,
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                运筹决策助手
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontStyle: 'italic',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                智能决策助手
              </Typography>
            </Toolbar>
          </AppBar>

          {/* 主内容区域 - 移动端优化 */}
          <Box
            sx={{
              py: { xs: 2, sm: 3, md: 4 },
              px: { xs: 1, sm: 2 },
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              maxWidth: '100vw',
              boxSizing: 'border-box'
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                bgcolor: 'background.paper',
                borderRadius: { xs: 8, sm: 12 },
                border: 1,
                borderColor: 'divider',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create" element={<ProblemCreation />} />
                <Route path="/problem/:id" element={<ProblemDetail />} />
                <Route path="/legacy" element={<DecisionFlow />} />
              </Routes>
            </Paper>
          </Box>

          {/* 页脚 - 移动端优化 */}
          <Box
            component="footer"
            sx={{
              py: { xs: 2, sm: 3 },
              px: { xs: 1, sm: 2 },
              bgcolor: 'background.paper',
              borderTop: 1,
              borderColor: 'divider'
            }}
          >
            <Box sx={{ width: '100%', maxWidth: '100vw', boxSizing: 'border-box' }}>
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                © 2025 运筹决策助手 - 基于运筹学AHP+TOPSIS模型的决策辅助系统
              </Typography>
            </Box>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;