import React, { useEffect } from "react";

type Props = { children: React.ReactNode };

type State = { hasError: boolean };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // يمكنك إرسال الخطأ إلى خدمة تتبع الأخطاء هنا
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // إضافة إعادة التحميل التلقائي
      setTimeout(() => {
        window.location.reload();
      }, 2000);

      return (
        <div className="w-full h-screen flex flex-col items-center justify-center text-center text-red-600">
          <h2 className="text-2xl font-bold mb-4">Une erreur inattendue s'est produite 😢</h2>
          <p className="mb-2">Nous nous excusons sincèrement pour ce désagrément.</p>
          <p className="mb-6">Notre équipe technique a été notifiée et travaille à résoudre ce problème.</p>
          <p className="mb-4 text-sm">La page sera automatiquement rechargée dans 2 secondes...</p>
          <button
            onClick={this.handleReload}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Rafraîchir maintenant
          </button>
        </div>
      );
    }
    return this.props.children;
  }
} 