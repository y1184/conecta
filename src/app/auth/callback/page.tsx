"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Escuchamos el evento de recuperación de Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Si el evento es de recuperación, lo mandamos a la página de cambiar contraseña
        router.push("/nueva-password");
      } else if (session) {
        // Si ya hay una sesión, lo mandamos al perfil
        router.push("/perfil");
      }
    });

    // Fallback por si acaso el evento no se dispara en 2 segundos
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          router.push("/perfil"); 
        } else {
          router.push("/login");
        }
      });
    }, 2000);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-600 font-medium animate-pulse">Verificando link de seguridad...</p>
    </div>
  );
}
