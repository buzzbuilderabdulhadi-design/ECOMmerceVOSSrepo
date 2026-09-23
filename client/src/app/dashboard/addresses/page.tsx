'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiStar, FiArrowRight } from 'react-icons/fi';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';
import { fetchAddresses, createAddress, updateAddress, deleteAddress } from '@/services/addresses';
import type { Address } from '@/types';

// ============================================================
// Addresses — saved shipping/billing address management
// ============================================================

const emptyForm = {
  label: '',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  isDefault: false,
};

type AddressForm = typeof emptyForm;

function isComplete(form: AddressForm): boolean {
  return Boolean(
    form.label.trim() && form.fullName.trim() && form.phone.trim() && form.line1.trim() &&
    form.city.trim() && form.state.trim() && form.zip.trim() && form.country.trim()
  );
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAddresses(await fetchAddresses());
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchAddresses()
      .then((list) => {
        if (active) setAddresses(list);
      })
      .catch(() => {
        if (active) setAddresses([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? '',
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      isDefault: address.isDefault,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!isComplete(form)) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editingId) {
        await updateAddress(editingId, { ...form, line2: form.line2.trim() || undefined });
        toast.success('Address updated');
      } else {
        await createAddress({ ...form, line2: form.line2.trim() || undefined });
        toast.success('Address added');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleMakeDefault = async (address: Address) => {
    try {
      await updateAddress(address.id, { isDefault: true });
      await load();
      toast.success('Default address updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update default address');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await deleteAddress(deletingId);
      toast.success('Address deleted');
      setDeletingId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete address');
    } finally {
      setDeleteLoading(false);
    }
  };

  const defaultAddress = addresses.find((addr) => addr.isDefault);

  return (
    <DashboardLayout title="Addresses" subtitle="Manage your shipping and billing addresses.">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate">
          {addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'}
        </p>
        <Button type="button" variant="walnut" size="md" onClick={openCreate} leftIcon={<FiPlus className="h-4 w-4" />}>
          Add Address
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-sage-light/30 bg-white" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl border border-sage-light/30 bg-white p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-light/40 text-sage-dark">
            <FiMapPin className="h-7 w-7" />
          </div>
          <h2 className="mt-6 font-display text-3xl font-light text-navy">No saved addresses</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate">
            Add a shipping address to enjoy a swifter, more seamless checkout experience.
          </p>
          <Button type="button" onClick={openCreate} className="mt-8" variant="walnut" size="md" rightIcon={<FiArrowRight className="h-4 w-4" />}>
            Add an Address
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div key={address.id} className="flex flex-col rounded-2xl border border-sage-light/30 bg-white p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block rounded-full bg-navy px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cream">
                    {address.label || 'Address'}
                  </span>
                  {address.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sage-light/50 px-3 py-1 text-[11px] font-medium text-sage-dark">
                      <FiStar className="h-3 w-3" /> Default
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(address)}
                    aria-label={`Edit ${address.label || 'address'}`}
                    className="rounded-full p-2 text-slate transition-colors hover:bg-sage-light/30 hover:text-sage-dark"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(address.id)}
                    aria-label={`Delete ${address.label || 'address'}`}
                    className="rounded-full p-2 text-slate transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 text-sm text-slate">
                <p className="font-medium text-navy">{address.fullName}</p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}, {address.state} {address.zip}
                </p>
                <p>{address.country}</p>
                <p className="mt-1 text-xs">{address.phone}</p>
              </div>

              {!address.isDefault && (
                <button
                  type="button"
                  onClick={() => handleMakeDefault(address)}
                  className="mt-4 self-start text-xs font-medium text-walnut underline-offset-2 transition-colors hover:text-walnut-light hover:underline"
                >
                  Set as default
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {addresses.length > 0 && defaultAddress === undefined && (
        <p className="mt-4 text-xs text-slate">
          Tip: set a default address and it will be pre-selected at checkout.
        </p>
      )}

      {/* Add / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Address' : 'Add Address'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          noValidate
        >
          <Input
            label="Label"
            name="label"
            placeholder="Home, Work…"
            value={form.label}
            onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
            required
          />
          <Input
            label="Full Name"
            name="fullName"
            placeholder="Recipient name"
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            required
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            required
          />
          <Input
            label="Country"
            name="country"
            placeholder="United States"
            value={form.country}
            onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
            required
          />
          <div className="sm:col-span-2">
            <Input
              label="Address Line 1"
              name="line1"
              placeholder="Street address"
              value={form.line1}
              onChange={(e) => setForm((prev) => ({ ...prev, line1: e.target.value }))}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Address Line 2 (optional)"
              name="line2"
              placeholder="Apartment, suite, unit…"
              value={form.line2}
              onChange={(e) => setForm((prev) => ({ ...prev, line2: e.target.value }))}
            />
          </div>
          <Input
            label="City"
            name="city"
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="State"
              name="state"
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
              required
            />
            <Input
              label="ZIP / Postal Code"
              name="zip"
              placeholder="ZIP"
              value={form.zip}
              onChange={(e) => setForm((prev) => ({ ...prev, zip: e.target.value }))}
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-navy sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              className="h-4 w-4 accent-sage-dark"
            />
            Set as my default address
          </label>

          {formError && <p className="text-xs text-red-500 sm:col-span-2">{formError}</p>}

          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button type="button" variant="outline" size="md" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="walnut" size="md" isLoading={saving}>
              {editingId ? 'Save Changes' : 'Add Address'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deletingId !== null}
        title="Delete address?"
        message="This address will be permanently removed from your account."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </DashboardLayout>
  );
}