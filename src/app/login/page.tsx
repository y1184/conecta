"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

export default function Login () {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async () => {
        setLoading(true);
        setError("");

        const {error: authError} = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError) {
            setError("Email o contraseña incorrectos");
            setLoading(false);
            return;
        }
        router.push("/trabajadores");
    };

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <Link href="/" className="text-2xl font-bold text-sky-600">
                    Conecta
                    </Link>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold mb-2">Iniciar sesiòn</h1>
                <p className="text-gray-600 mb-8">
                    Entra a tù cuenta para ver y editar tù perfil.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Email
                        </label>
                        <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full boder border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600"
                        />
                    </div>

                    <div >
                        <label className="block text-sm font-medium mb-2">
                            Contraseña 
                        </label>
                        <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Tu contraseña"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600" 
                        />
                    </div>

                    {error&& (
                        <p className="text-red-600 text-sm">{error}</p>
                    )}

                    <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full- bg-sky-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Ingresando..." : "Ingresar"}
                    </button>
                </div>

                <p className="text-sm text-center mt-4">
                    <Link 
                    href="/recuperar"
                    className="text-sky-600 hover:underline"
                    >
                        ¿Olvidaste tu contraseña?
                    </Link>
                </p>

                <p className="text-sm text-gray-600 mt-6 text-center">
                    ¿No tenès cuenta?{""}
                    <Link href="/registro" className="text-sky-600 hover:underline">
                    Registrarse
                    </Link>
                </p>
            </main>
        </div>
    );
}