class InquiryMailer < ApplicationMailer
  TO_ADDRESS = "code.for.func@gmail.com"

  def new_inquiry
    @inquiry = params.fetch(:inquiry)

    attach_uploaded_files(@inquiry)

    mail(
      to: TO_ADDRESS,
      subject: "Новая заявка: #{@inquiry.name.presence || "без имени"}"
    )
  end

  private

  def attach_uploaded_files(inquiry)
    return unless inquiry.attachments.attached?

    inquiry.attachments.each do |attachment|
      blob = attachment.blob
      next unless blob

      attachments[blob.filename.to_s] = {
        mime_type: blob.content_type,
        content: blob.download
      }
    end
  end
end
