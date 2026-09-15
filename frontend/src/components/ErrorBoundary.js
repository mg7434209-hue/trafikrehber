import React from 'react';
export default class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="container"><div className="state-message error-state" role="alert"><h1>Sayfa yüklenemedi</h1><p>Bağlantınızı kontrol edip yeniden deneyebilirsiniz.</p><button className="btn btn-secondary" onClick={() => window.location.reload()}>Yeniden yükle</button></div></div>;
    return this.props.children;
  }
}
