import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import {
  useEffect,
  useState,
  type ReactNode,
  Component,
} from 'react';
import './global.css';

import { Toaster } from 'sonner';
import type { Route } from './+types/root';

export const links = () => [];

function SharedErrorBoundary({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children?: ReactNode;
}): React.ReactElement {
  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
        isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="bg-[#18191B] text-[#F2F2F2] rounded-lg p-4 max-w-md w-full mx-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-[#F2F2F2] rounded-full flex items-center justify-center">
              <span className="text-black text-[1.125rem] leading-none">!</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <div className="flex flex-col gap-1">
              <p className="font-light text-[#F2F2F2] text-sm">App Error Detected</p>
              <p className="text-[#959697] text-sm font-light">
                It looks like an error occurred while trying to use your app.
              </p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <SharedErrorBoundary isOpen={true} />;
}

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = { hasError: boolean; error: unknown | null };

class ErrorBoundaryWrapper extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <SharedErrorBoundary isOpen={true} />;
    }
    return this.props.children;
  }
}

function LoaderWrapper({ loader }: { loader: () => React.ReactNode }) {
  return <>{loader()}</>;
}

type ClientOnlyProps = {
  loader: () => React.ReactNode;
};

export const ClientOnly: React.FC<ClientOnlyProps> = ({ loader }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <ErrorBoundaryWrapper>
      <LoaderWrapper loader={loader} />
    </ErrorBoundaryWrapper>
  );
};

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ErrorBoundaryWrapper>
          {children}
        </ErrorBoundaryWrapper>
        <Toaster position="bottom-right" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
