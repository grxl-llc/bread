import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BreadLogo from '@/components/branding/BreadLogo';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#15233A]">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                        <BreadLogo variant="light" size="lg" />
                    </div>

                    {/* 404 Error Code */}
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-[#C4C4BA]/30">404</h1>
                        <div className="h-0.5 w-16 bg-[#FF6B35] mx-auto"></div>
                    </div>
                    
                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-[#F5F5F0]">
                            Page Not Found
                        </h2>
                        <p className="text-sm text-[#C4C4BA]/60 leading-relaxed">
                            The page <span className="font-semibold text-[#FF6B35]">"{pageName}"</span> could not be found.
                        </p>
                    </div>
                    
                    {/* Admin Note */}
                    {isFetched && authData?.isAuthenticated && authData.user?.role === 'admin' && (
                        <div className="mt-8 p-4 bg-[#FF6B35]/10 rounded-xl border border-[#FF6B35]/20">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                                <div className="text-left space-y-1">
                                    <p className="text-sm font-semibold text-[#F5F5F0]">Admin Note</p>
                                    <p className="text-xs text-[#C4C4BA]/80 leading-relaxed">
                                        This page hasn't been created yet. Ask the AI to implement it in the chat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Action Button */}
                    <div className="pt-6">
                        <Button
                            onClick={() => window.location.href = '/'}
                            className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Go Home
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}