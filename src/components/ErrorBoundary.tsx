/**
 * ErrorBoundary — red de seguridad de la app.
 *
 * Si cualquier componente hijo lanza un error al renderizar, en vez de dejar
 * la pantalla en blanco (lo que veía el usuario hasta ahora), muestra un
 * mensaje claro con un botón para recargar. Es un componente de clase porque
 * React solo permite capturar estos errores con class components.
 */
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    // Al capturar un error, marcamos el estado para mostrar el fallback.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: unknown) {
    // Dejamos rastro en la consola para poder depurar si hace falta.
    console.error('ErrorBoundary capturó un error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="text-4xl">⚠️</div>
            <h1 className="text-lg font-semibold text-foreground">
              Algo ha fallado
            </h1>
            <p className="text-sm text-muted-foreground">
              Ha ocurrido un error inesperado. Puedes recargar la página para
              volver a intentarlo. Tus datos están a salvo.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Recargar la página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
