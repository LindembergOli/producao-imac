/**
 * PÁGINA: Gerenciamento de Usuários
 * 
 * Permite que administradores listem e criem novos usuários
 * com diferentes níveis de acesso.
 */

import React, { useState, useEffect } from 'react';
import { User, usersService } from '../services/modules/users';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Shield, User as UserIcon, Mail, Lock, Pencil, Eye } from 'lucide-react';
import { Sector } from '../types';
import ViewModal from '../components/ViewModal';

export default function Users() {
    const { register, isEspectador } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Estados para visualização
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState<User | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'ESPECTADOR'
    });

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await usersService.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            alert('Erro ao carregar lista de usuários');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            await usersService.delete(id);
            await loadUsers();
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            alert('Erro ao excluir usuário');
        }
    };

    const handleEdit = (user: User) => {
        setCurrentUser(user);
        setIsEditing(true);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Deixar vazio - senha opcional na edição
            role: user.role
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsEditing(false);
        setCurrentUser(null);
        setFormData({ name: '', email: '', password: '', role: 'ESPECTADOR' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentUser) {
                // Editar usuário existente
                const updateData: any = {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role
                };

                // Apenas incluir senha se foi fornecida
                if (formData.password) {
                    updateData.password = formData.password;
                }

                await usersService.update(currentUser.id, updateData);
                alert('Usuário atualizado com sucesso!');
            } else {
                // Criar novo usuário
                const { authService } = await import('../services/authService');
                await authService.register({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                });
                alert('Usuário criado com sucesso!');
            }

            handleCloseModal();
            await loadUsers();
        } catch (error: any) {
            console.error('Erro ao salvar usuário:', error);
            alert(error.response?.data?.message || 'Erro ao salvar usuário');
        }
    };

    const roleLabels: Record<string, string> = {
        ADMIN: 'Administrador',
        SUPERVISOR: 'Supervisor',
        LIDER_PRODUCAO: 'Líder de Produção',
        ESPECTADOR: 'Espectador'
    };

    const roleColors: Record<string, string> = {
        ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        SUPERVISOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        LIDER_PRODUCAO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        ESPECTADOR: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gerenciamento de Usuários</h1>
                    <p className="text-slate-600 dark:text-slate-400">Controle de acesso e permissões do sistema</p>
                </div>
                {!isEspectador() && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-imac-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Usuário
                    </button>
                )}
            </div>

            {/* Users List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Usuário</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Função</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[user.role] || roleColors.ESPECTADOR}`}>
                                            {roleLabels[user.role] || user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => { setViewData(user); setIsViewModalOpen(true); }}
                                                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                title="Visualizar usuário"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            {!isEspectador() && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Editar usuário"
                                                    >
                                                        <Pencil className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Excluir usuário"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Novo Usuário */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-imac-primary"
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-imac-primary"
                                        placeholder="email@imac.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Senha {!isEditing && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        required={!isEditing}
                                        minLength={6}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-imac-primary"
                                        placeholder={isEditing ? "Deixe em branco para manter a senha atual" : "******"}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Função / Permissão</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-imac-primary appearance-none"
                                    >
                                        <option value="ESPECTADOR">Espectador (Apenas Visualização)</option>
                                        <option value="LIDER_PRODUCAO">Líder de Produção (Registros)</option>
                                        <option value="SUPERVISOR">Supervisor (Gestão de Equipe)</option>
                                        <option value="ADMIN">Administrador (Acesso Total)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-imac-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                                >
                                    {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detalhes do Usuário"
                data={viewData}
                fields={[
                    { label: 'Nome', key: 'name' },
                    { label: 'Email', key: 'email' },
                    { label: 'Função', key: 'role', format: (v: string) => roleLabels[v] || v }
                ]}
            />
        </div>
    );
}
