import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper
} from '@mui/material';
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
              DecisionFlow
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
        <Container
          maxWidth="lg"
          sx={{
            py: { xs: 2, sm: 3, md: 4 },
            px: { xs: 1, sm: 2 },
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
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
            {/* 应用介绍 - 移动端优化 */}
            <Box sx={{
              mb: { xs: 2, sm: 3, md: 4 },
              textAlign: 'center'
            }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                欢迎使用 DecisionFlow
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  maxWidth: 600,
                  mx: 'auto',
                  lineHeight: 1.6,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                基于AHP + TOPSIS混合模型的智能决策辅助工具。通过科学的层次分析法和优劣解距离法，
                帮助您在多准则决策中找到最优解决方案。
              </Typography>
            </Box>

            {/* 决策流程组件 */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <DecisionFlow />
            </Box>
          </Paper>
        </Container>

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
          <Container maxWidth="lg">
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              © 2024 DecisionFlow - 基于运筹学AHP+TOPSIS模型的决策辅助系统
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;