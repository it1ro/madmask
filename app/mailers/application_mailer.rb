class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAIL_FROM", "no-reply@madmask.ilmir.tech")
  layout "mailer"
end
