/*
 * DESIGN: Blueprint Industrial
 * Sidebar de navegação com menu hambúrguer
 * Tema escuro, acentos laranja (segurança) e azul (blueprint)
 * Sidebar limpa: apenas navegação principal (Início e Módulos)
 * Integrado com autenticação
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Home,
  Layers,
  LogIn,
  LogOut,
  User,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, profile, signOut } = useAuth();

  const navItems = [
    { href: "/", label: "Início", icon: Home },
    { href: "/estudos", label: "Módulos", icon: Layers },
  ];

  async function handleLogout() {
    await signOut();
    setIsOpen(false);
  }

  return (
    <>
      {/* Header fixo com hambúrguer */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-neutral-800/50">
        <div className="container flex items-center justify-between h-full">
          {/* Hambúrguer */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center w-10 h-10 text-neutral-400 hover:text-orange-400 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo central */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-500 flex items-center justify-center rounded-sm">
              <span className="text-white font-bold text-xs font-['Bebas_Neue']">M</span>
            </div>
            <span className="font-['Bebas_Neue'] text-lg tracking-wider text-white">
              MESTRIA
            </span>
          </Link>

          {/* Espaço vazio para manter o logo centralizado */}
          <div className="w-10 h-10" />
        </div>
      </header>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-[70] w-[280px] bg-[#0d0d0d] border-r border-neutral-800/50 flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 flex items-center justify-center rounded-sm">
                  <span className="text-white font-bold text-sm font-['Bebas_Neue']">M</span>
                </div>
                <span className="font-['Bebas_Neue'] text-xl tracking-wider text-white">
                  MESTRIA
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-8 h-8 text-neutral-500 hover:text-white transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navegação Principal */}
            <nav className="p-3 flex-1">
              <p className="text-[9px] font-mono text-neutral-600 tracking-[0.2em] uppercase px-3 mb-2">
                Navegação
              </p>
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md mb-0.5 transition-all ${
                      isActive
                        ? "bg-orange-500/10 text-orange-400"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-['IBM_Plex_Sans'] font-medium">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* User Section & Footer */}
            <div className="p-4 border-t border-neutral-800/30 space-y-4">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-md">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate font-['IBM_Plex_Sans']">
                        {profile?.full_name || 'Usuário'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate font-mono">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {!profile || profile.role !== 'admin' ? (
                      <Link href="/checkout" onClick={() => setIsOpen(false)}>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-transparent border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Adquirir Curso
                        </Button>
                      </Link>
                    ) : null}
                    
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full justify-start bg-transparent border-neutral-700 text-neutral-300 hover:bg-red-900/20 hover:text-red-400 hover:border-red-700"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </>
              ) : (
                /* Login/Signup Buttons */
                <div className="space-y-2">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      <LogIn className="w-4 h-4 mr-2" />
                      Entrar
                    </Button>
                  </Link>
                  <Link href="/cadastro" onClick={() => setIsOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Criar Conta
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Copyright */}
              <p className="text-[10px] text-neutral-700 font-mono text-center pt-2">
                &copy; {new Date().getFullYear()} Mestria
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
