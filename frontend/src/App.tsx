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
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* 顶部导航栏 */}
        <AppBar
          position="static"
          elevation={2}
          sx={{
            bgcolor: 'white',
            color: 'text.primary',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Toolbar>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent'
              }}
            >
              DecisionFlow
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic' }}
            >
              智能决策助手
            </Typography>
          </Toolbar>
        </AppBar>

        {/* 主内容区域 */}
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: 1,
              borderColor: 'divider'
            }}
          >
            {/* 应用介绍 */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: 'primary.main'
                }}
              >
                欢迎使用 DecisionFlow
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}
              >
                基于AHP + TOPSIS混合模型的智能决策辅助工具。通过科学的层次分析法和优劣解距离法，
                帮助您在多准则决策中找到最优解决方案。
              </Typography>
            </Box>

            {/* 决策流程组件 */}
            <DecisionFlow />
          </Paper>
        </Container>

        {/* 页脚 */}
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: 'auto',
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