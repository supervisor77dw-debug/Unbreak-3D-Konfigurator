import React from 'react';
import { notifyError } from '../utils/iframeBridge';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
        
        // Notify parent window of error
        notifyError(
            error?.message || '3D Scene initialization error',
            error?.stack || errorInfo?.componentStack
        );
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: 'red', background: '#fff0f0' }}>
                    <h2>3D View Error</h2>
                    <p>Something went wrong loading the 3D scene.</p>
                    <pre style={{ fontSize: '0.8rem' }}>{this.state.error && this.state.error.toString()}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
