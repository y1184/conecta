"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

export default function Registro() {
   const [nombre, setNombre]= useState("");
   const [email, setEmail]= useState("");
   const [password, setPassword]= useState("");
   const [oficio, setOficio] = useState("");
   const [ciudad, setCiudad] = useState("");
   const [tarifa, setTarifa] = useState("");
   const [descripcion, setDescripcion] = useState(" ");
   const [whatsapp, setWhatsapp] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
   const router = useRouter();

   const handleRegistro = async () => {
    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
    });
    if (authError){
        setError(authError.message);
        setLoading(false);
        return;
    }

    if(authData.user){
        const { error: profileError } = await supabase
        .from("trabajadores")
        .insert({
            user_id: authData.user.id,
            nombre: nombre,
            oficio: oficio,
            email: email,
            ciudad: ciudad || "Sin especificar",
            tarifa: tarifa || "A convenir",
            rating: 0,
            tiene_unipersonal: false,
            descripcion: descripcion|| " ",
            whatsapp: whatsapp || null,
        });
        
        if(profileError){
            setError(profileError.message);
            setLoading(false);
            return;
        }
        router.push("/trabajadores");
    }
   }

    return(
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-6 py-4">
                <Link href="/" className="text-2xl font-bold text-sky-600">
                Conecta
                </Link>
            </div>
        </header>

        <main className="max-w-md mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold mb-2">Crear cuenta</h1>
            <p className="text-gray-600 mb-8">
                Registrate como trabajador y empezà a ofrecer tus servicios.
            </p>

            < div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Nombre completo
                        </label>
                        <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Juan Perez"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600"
                        />               
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                 Email
                </label>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                Oficio
                </label>
                <input
                type="text"
                value={oficio}
                onChange={(e) => setOficio(e.target.value)}
                placeholder="Ej: Electricista"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Ciudad
                </label>
                <input
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Tarifa por hora(opcional)
                </label>
                <input 
                type="text"
                value={tarifa}
                onChange={(e) => setTarifa(e.target.value)}
                placeholder="Ej: $500/hora"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">
                    Descripciòn personal
                </label>
                <textarea
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Contame algo sobre vos, tù experiencias, tus servicios,..."
                className="w-full border boder-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600">

                </textarea>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    WhatsApp (opcional)
                </label>
                <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej: 59867896543"
                className="w-full border border-gray-300 rounded-lg py-3 outline-none focus:border-blue-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Ingresa con codigo del pais, sin el + (ej: 59896129191)
                </p>
            </div>

            <div>
             <label className="block text-sm font-medium mb-2">
                Contraseña 
             </label>
             <input
             type="password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             placeholder="Minimo 6 caracteres"
             className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600"
             />
            </div>

            {error &&(
                <p className="text-red-600 text-sm mb-2">{error}</p>
            )}

            <button
            onClick={handleRegistro}
            disabled={loading}
            className="w-full bg-sky-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? "Registrando..." : "Registrarse"}
            </button>
           </div>
        </main>
      </div>
    );
}