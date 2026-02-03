// DMCA / Content Takedown Request page
import { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import LegalPageLayout from './LegalPageLayout';
import { supabase } from '../../services/gallery-service';

interface FormData {
  requesterName: string;
  requesterEmail: string;
  requesterCompany: string;
  contentUrl: string;
  reason: string;
  description: string;
  goodFaithStatement: boolean;
}

export default function DMCARequestPage() {
  const [formData, setFormData] = useState<FormData>({
    requesterName: '',
    requesterEmail: '',
    requesterCompany: '',
    contentUrl: '',
    reason: '',
    description: '',
    goodFaithStatement: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.goodFaithStatement) {
      setErrorMessage('You must confirm the good faith statement to submit.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const { error } = await supabase.from('dmca_requests').insert({
        requester_name: formData.requesterName,
        requester_email: formData.requesterEmail,
        requester_company: formData.requesterCompany || null,
        content_url: formData.contentUrl,
        reason: formData.reason,
        description: formData.description,
        good_faith_statement: formData.goodFaithStatement,
        status: 'pending',
      });

      if (error) {
        console.error('DMCA submission error:', error);
        // If table doesn't exist, show a friendly message
        if (error.code === '42P01') {
          setErrorMessage('Request submission is temporarily unavailable. Please email legal@rsip-platform.com');
        } else {
          setErrorMessage('Failed to submit request. Please try again or email legal@rsip-platform.com');
        }
        setSubmitStatus('error');
      } else {
        setSubmitStatus('success');
        setFormData({
          requesterName: '',
          requesterEmail: '',
          requesterCompany: '',
          contentUrl: '',
          reason: '',
          description: '',
          goodFaithStatement: false,
        });
      }
    } catch (err) {
      console.error('DMCA submission error:', err);
      setErrorMessage('An unexpected error occurred. Please email legal@rsip-platform.com');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LegalPageLayout title="DMCA / Content Takedown Request" lastUpdated="February 3, 2026">
      <p className="mb-6">
        If you believe content displayed in the RSIP Application Gallery infringes your
        intellectual property rights, privacy, or other legal rights, please submit a
        takedown request using the form below.
      </p>

      <h2>Before You Submit</h2>
      <p>Please note:</p>
      <ul>
        <li>
          The Gallery displays content via official embedding mechanisms or links to
          original sources. We do not host the content ourselves.
        </li>
        <li>
          For YouTube, TikTok, or LinkedIn content, you may also want to report the
          content directly to that platform.
        </li>
        <li>
          We will review your request and respond within 5-7 business days.
        </li>
        <li>
          False or abusive takedown requests may result in legal liability.
        </li>
      </ul>

      <h2>Submit a Request</h2>

      {submitStatus === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 my-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-green-900">Request Submitted Successfully</h3>
          </div>
          <p className="text-green-800">
            Thank you for your submission. We will review your request and respond to the
            email address you provided within 5-7 business days.
          </p>
          <button
            onClick={() => setSubmitStatus('idle')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 my-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="requesterName" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                id="requesterName"
                name="requesterName"
                required
                value={formData.requesterName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="requesterEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Your Email *
              </label>
              <input
                type="email"
                id="requesterEmail"
                name="requesterEmail"
                required
                value={formData.requesterEmail}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="requesterCompany" className="block text-sm font-medium text-gray-700 mb-1">
              Company/Organization (optional)
            </label>
            <input
              type="text"
              id="requesterCompany"
              name="requesterCompany"
              value={formData.requesterCompany}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Content Identification */}
          <div>
            <label htmlFor="contentUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Content URL *
            </label>
            <input
              type="url"
              id="contentUrl"
              name="contentUrl"
              required
              placeholder="https://..."
              value={formData.contentUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              The URL of the content in the Gallery or the original source URL
            </p>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Request *
            </label>
            <select
              id="reason"
              name="reason"
              required
              value={formData.reason}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a reason...</option>
              <option value="copyright">Copyright Infringement</option>
              <option value="trademark">Trademark Infringement</option>
              <option value="privacy">Privacy Violation</option>
              <option value="defamation">Defamation</option>
              <option value="confidential">Confidential Information</option>
              <option value="other">Other Legal Issue</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              value={formData.description}
              onChange={handleChange}
              placeholder="Please describe the issue and explain your rights to the content..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Good Faith Statement */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="goodFaithStatement"
                checked={formData.goodFaithStatement}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I have a good faith belief that the use of the material in the manner complained
                of is not authorized by the copyright owner, its agent, or the law. I understand
                that submitting false information may result in legal liability. The information
                provided in this form is accurate and, under penalty of perjury, I am authorized
                to act on behalf of the rights holder.
              </span>
            </label>
          </div>

          {/* Error Message */}
          {submitStatus === 'error' && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Request
              </>
            )}
          </button>
        </form>
      )}

      <h2>Alternative Contact</h2>
      <p>
        If you prefer, you can also submit your request via email to{' '}
        <a href="mailto:legal@rsip-platform.com">legal@rsip-platform.com</a>. Please include
        all the information requested in the form above.
      </p>

      <h2>Response Process</h2>
      <ol>
        <li><strong>Receipt:</strong> You will receive an acknowledgment within 2 business days.</li>
        <li><strong>Review:</strong> Our team will review your request and verify the information.</li>
        <li><strong>Action:</strong> If valid, we will remove or disable access to the content.</li>
        <li><strong>Notification:</strong> You will be notified of the outcome via email.</li>
      </ol>
    </LegalPageLayout>
  );
}
