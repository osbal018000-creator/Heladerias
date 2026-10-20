import { useState } from 'react';
import { useCustomers } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { formatDate } from '@/lib/format';
import { Button } from './Button';
import { Modal } from './Modal';
import type { Customer } from '@/lib/types';
import { Plus, Pencil, Trash2, Phone, User } from 'lucide-react';

export function Customers() {
  const { customers, reload } = useCustomers();
  const { notify } = useToast();
  const [editing, setEditing] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);

  const remove = async (c: Customer) => {
    if (!confirm(`¿Eliminar al cliente "${c.name}"?`)) return;
    const { error } = await supabase.from('customers').delete().eq('id', c.id);
    if (error) {
      notify('error', 'No se pudo eliminar.');
      return;
    }
    notify('success', 'Cliente eliminado.');
    reload();
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold font-display text-choco-600">Clientes</h1>
          <p className="text-sm text-choco-400 mt-0.5">
            Registro opcional de clientes frecuentes
          </p>
        </div>
        <Button onClick={() => setCreating(true)} size="lg">
          <Plus className="w-5 h-5" />
          Nuevo
        </Button>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-16 text-choco-400">
          <User className="w-10 h-10 mx-auto mb-3 opacity-30 text-cream-300" />
          <p>No hay clientes registrados.</p>
          <p className="text-sm mt-1">
            Registra clientes solo cuando sea útil para el negocio.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-cream-200 shadow-soft p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-strawberry-100 text-strawberry-600 flex items-center justify-center font-bold font-display">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold font-display text-choco-600">{c.name}</p>
                    {c.phone && (
                      <p className="text-xs text-choco-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {c.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(c)}
                    className="p-1.5 rounded-xl text-choco-300 hover:bg-cream-100 hover:text-choco-500"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="p-1.5 rounded-xl text-choco-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {c.notes && (
                <p className="text-xs text-choco-400 mt-2 bg-cream-100 rounded-xl p-2">
                  {c.notes}
                </p>
              )}
              <p className="text-xs text-choco-400 mt-2">
                Desde {formatDate(c.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <CustomerForm
          customer={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            reload();
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function CustomerForm({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [notes, setNotes] = useState(customer?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      notify('error', 'El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      };
      if (customer) {
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', customer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('customers').insert(payload);
        if (error) throw error;
      }
      notify('success', 'Cliente guardado.');
      onSaved();
    } catch {
      notify('error', 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={customer ? 'Editar cliente' : 'Nuevo cliente'}
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-bold font-display text-choco-600 block mb-1">
            Nombre
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 focus:ring-2 focus:ring-strawberry-100 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-bold font-display text-choco-600 block mb-1">
            Teléfono
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 focus:ring-2 focus:ring-strawberry-100 outline-none"
            placeholder="300 123 4567"
          />
        </div>
        <div>
          <label className="text-sm font-bold font-display text-choco-600 block mb-1">
            Observaciones
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 focus:ring-2 focus:ring-strawberry-100 outline-none resize-none"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
