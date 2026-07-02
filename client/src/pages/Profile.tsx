import {
  CreditCardIcon,
  MailIcon,
  MapPinIcon,
  PackageIcon,
  SaveIcon,
  Trash2Icon,
  UploadIcon,
  UserIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import LoadingButton from "../components/ui/LoadingButton";
import { getApiErrorMessage } from "../config/api";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatPrice } from "../lib/format";
import { profileService } from "../services/profileService";
import { walletService, type WalletTransaction } from "../services/walletService";

const toDateInput = (value?: string) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const Profile = () => {
  const { addresses, orders, wishlistIds } = useAppContext();
  const { logout, updateUser, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    avatar: user?.avatar ?? "",
    dob: toDateInput(user?.dob),
    gender: user?.gender ?? "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      name: user.name,
      phone: user.phone ?? "",
      avatar: user.avatar ?? "",
      dob: toDateInput(user.dob),
      gender: user.gender ?? "",
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setWalletLoading(true);
    void walletService
      .getWallet()
      .then((wallet) => {
        setWalletBalance(wallet.balance);
        setWalletTransactions(wallet.transactions);
      })
      .finally(() => setWalletLoading(false));
  }, [user]);

  const initials = useMemo(() => user?.name.charAt(0).toUpperCase() ?? "U", [user?.name]);

  if (!user) return null;

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updatedUser = await profileService.updateProfile({
        ...profileForm,
        dob: profileForm.dob ? new Date(profileForm.dob).toISOString() : "",
      });

      if (updatedUser) updateUser(updatedUser);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update profile"));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const avatar = await profileService.uploadAvatar(file);
      setProfileForm((current) => ({ ...current, avatar }));
      const updatedUser = await profileService.updateProfile({ ...profileForm, avatar });
      if (updatedUser) updateUser(updatedUser);
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not upload avatar"));
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChangingPassword(true);
    try {
      await profileService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      toast.success("Password changed");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not change password"));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete this account permanently?")) return;
    setDeleting(true);
    try {
      await profileService.deleteAccount();
      toast.success("Account deleted");
      logout();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete account"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-cream">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-app-orange">Account</p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-950">Profile</h1>
          <p className="mt-2 max-w-2xl text-zinc-500">
            Manage delivery contact details, wallet, password, and account settings.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-6">
          <form onSubmit={handleProfileSave} className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {profileForm.avatar ? (
                <img
                  src={profileForm.avatar}
                  alt={user.name}
                  className="size-20 rounded-full bg-green-50 object-cover"
                />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-full bg-app-green text-3xl font-bold text-white">
                  {initials}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-zinc-950">{user.name}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                  <MailIcon className="size-4" aria-hidden="true" />
                  {user.email}
                </p>
              </div>
              <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-app-green px-4 text-sm font-semibold text-app-green hover:bg-green-50">
                <UploadIcon className="size-4" aria-hidden="true" />
                {uploading ? "Uploading" : "Avatar"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => void handleAvatarUpload(event.target.files?.[0])}
                />
              </label>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Full name</span>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Phone</span>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Date of birth</span>
                <input
                  type="date"
                  value={profileForm.dob}
                  onChange={(event) => setProfileForm({ ...profileForm, dob: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Gender</span>
                <select
                  value={profileForm.gender}
                  onChange={(event) => setProfileForm({ ...profileForm, gender: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                >
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                </select>
              </label>
            </div>

            <LoadingButton type="submit" loading={saving} className="mt-6">
              <SaveIcon className="size-5" aria-hidden="true" />
              Save profile
            </LoadingButton>
          </form>

          <form onSubmit={handlePasswordChange} className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-zinc-950">Change password</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm({ ...passwordForm, currentPassword: event.target.value })
                }
                placeholder="Current password"
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
              />
              <input
                type="password"
                required
                minLength={6}
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm({ ...passwordForm, newPassword: event.target.value })
                }
                placeholder="New password"
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
              />
            </div>
            <LoadingButton type="submit" loading={changingPassword} className="mt-5">
              Change password
            </LoadingButton>
          </form>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg bg-white p-6 shadow-sm">
            <UserIcon className="mb-4 size-8 text-app-green" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-zinc-950">Account summary</h2>
            <div className="mt-5 grid gap-3">
              <Link
                to="/orders"
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 hover:border-app-green"
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <PackageIcon className="size-4 text-app-green" aria-hidden="true" />
                  Orders
                </span>
                <span className="font-bold text-zinc-950">{orders.length}</span>
              </Link>
              <Link
                to="/addresses"
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 hover:border-app-green"
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <MapPinIcon className="size-4 text-app-green" aria-hidden="true" />
                  Addresses
                </span>
                <span className="font-bold text-zinc-950">{addresses.length}</span>
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 hover:border-app-green"
              >
                <span className="text-sm font-semibold text-zinc-700">Wishlist</span>
                <span className="font-bold text-zinc-950">{wishlistIds.length}</span>
              </Link>
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow-sm">
            <CreditCardIcon className="mb-4 size-8 text-app-green" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-zinc-950">Wallet</h2>
            <p className="mt-2 text-3xl font-bold text-app-green">
              {walletLoading ? "Loading" : formatPrice(walletBalance)}
            </p>
            <div className="mt-4 space-y-3">
              {walletTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-zinc-950">{transaction.type}</p>
                    <p className="font-semibold text-app-green">{formatPrice(transaction.amount)}</p>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{formatDate(transaction.createdAt)}</p>
                </div>
              ))}
              {!walletLoading && walletTransactions.length === 0 && (
                <p className="text-sm text-zinc-500">Refunds and wallet recharges will appear here.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-red-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-950">Delete account</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              This disables your account and removes access to saved data.
            </p>
            <LoadingButton
              type="button"
              loading={deleting}
              onClick={() => void handleDeleteAccount()}
              className="mt-5 bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              <Trash2Icon className="size-5" aria-hidden="true" />
              Delete account
            </LoadingButton>
          </section>
        </aside>
      </section>
    </div>
  );
};

export default Profile;
