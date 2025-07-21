import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TimelineEditor Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>🚫 编辑器遇到错误</h3>
            <p>很抱歉，时间线编辑器遇到了一个错误。请刷新页面重试。</p>
            
            <div className="error-actions">
              <button 
                onClick={() => window.location.reload()}
                className="reload-button"
              >
                刷新页面
              </button>
              
              <button 
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="retry-button"
              >
                重试
              </button>
            </div>
            
            {import.meta.env.DEV && (
              <details className="error-details">
                <summary>错误详情（开发模式）</summary>
                <pre>{this.state.error && this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;