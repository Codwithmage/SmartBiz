import { useState, useEffect, useCallback } from "react";
import supabase from "../../../supabase/SupabaseClient";
import { useAuth } from "../../../context/AuthContext";
import { useBusiness } from "../../../context/BusinessContext";

export default function TeamPage() {
  const { role } = useAuth();
  const { business } = useBusiness();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("CASHIER");
  const [submitting, setSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch all staff members linked to active business
  const fetchTeamMembers = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from("profiles")
        .select("id, email, role, created_at")
        .eq("business_id", business.id)
        .order("created_at", { ascending: true });

      if (fetchErr) throw fetchErr;
      setMembers(data || []);
    } catch (err) {
      console.error("Error fetching team members:", err.message);
      setError("Failed to load team members.");
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Method: Generate custom shareable invite link
  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    if (!email.trim() || !business?.id) return;

    setSubmitting(true);
    setError(null);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // Check if profile exists already
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (existingUser) {
        // Update user directly if registered
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({ business_id: business.id, role: selectedRole })
          .eq("id", existingUser.id);

        if (updateErr) throw updateErr;

        alert("Staff member attached to your business!");
        closeModal();
        fetchTeamMembers();
      } else {
        // Save invitation token
        const { data, error: inviteErr } = await supabase
          .from("invitations")
          .insert({
            email: cleanEmail,
            business_id: business.id,
            role: selectedRole,
          })
          .select("token")
          .single();

        if (inviteErr) throw inviteErr;

        const inviteUrl = `${window.location.origin}/register?token=${data.token}`;
        setGeneratedLink(inviteUrl);
      }
    } catch (err) {
      console.error("Failed to generate invite:", err.message);
      setError(err.message || "Failed to generate invite link.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEmail("");
    setSelectedRole("CASHIER");
    setGeneratedLink("");
    setCopied(false);
    setError(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Update existing team member role
  const handleRoleChange = async (memberId, newRole) => {
    try {
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", memberId);

      if (updateErr) throw updateErr;

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      console.error("Failed to update role:", err.message);
      alert("Could not update staff role.");
    }
  };

  // Remove member from business
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;

    try {
      const { error: removeErr } = await supabase
        .from("profiles")
        .update({ business_id: null })
        .eq("id", memberId);

      if (removeErr) throw removeErr;

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      console.error("Failed to remove staff:", err.message);
      alert("Could not remove team member.");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Team Management</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Manage staff members and assign permission levels for {business?.name || "your business"}.
          </p>
        </div>

        {role === "OWNER" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors text-center"
          >
            + Add Staff Member
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Staff Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading staff members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No additional staff members found. Click "+ Add Staff Member" to get started.
          </div>
        ) : (
          <table className="w-full min-w-[600px] text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                <th className="p-4">Email Address</th>
                <th className="p-4">Current Role</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-gray-800 break-all max-w-[200px]">
                    {member.email || "No Email"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        member.role === "OWNER"
                          ? "bg-purple-100 text-purple-700"
                          : member.role === "MANAGER"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">
                    {member.created_at ? new Date(member.created_at).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap space-x-2 sm:space-x-3">
                    {role === "OWNER" && member.role !== "OWNER" && (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="CASHIER">CASHIER</option>
                          <option value="MANAGER">MANAGER</option>
                        </select>

                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Add Staff Member</h2>
            <p className="text-xs text-gray-500 mb-4">
              Enter the staff member's email to generate an invitation registration link.
            </p>

            {generatedLink ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-xs text-emerald-800 font-medium mb-1">Invitation Link Generated!</p>
                  <p className="text-xs text-gray-600 break-all bg-white p-2 border rounded">
                    {generatedLink}
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800 text-center"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="employee@smartbizz.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role Permission</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASHIER">Cashier (POS Checkout only)</option>
                    <option value="MANAGER">Manager (POS, Inventory & Expenses)</option>
                  </select>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-center"
                  >
                    {submitting ? "Generating..." : "Generate Invite Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}