class InquiriesController < ApplicationController
  def new
    @inquiry = Inquiry.new
    @product = Product.find_by(id: params[:product_id])

    if @product.present? && @inquiry.message.blank?
      product_link = "#{request.base_url}#{product_path(@product)}"
      @inquiry.message = <<~TEXT.strip
        Интересует товар: #{@product.name}
        Ссылка: #{product_link}

        Вопрос:
      TEXT
    end
    render :create
  end

  def create
    @inquiry = Inquiry.new(inquiry_params)

    if @inquiry.website.present?
      redirect_to new_inquiry_path, notice: "Заявка отправлена — скоро свяжемся."
      return
    end

    if @inquiry.save
      InquiryMailer.with(inquiry: @inquiry).new_inquiry.deliver_later
      redirect_to thanks_inquiries_path, notice: "Заявка отправлена — скоро свяжемся."
    else
      flash.now[:alert] = "Проверь поля формы и попробуй ещё раз."
      render :create, status: :unprocessable_entity
    end
  end

  def thanks
    render "pages/inquiry_thanks"
  end

  private

  def inquiry_params
    params.require(:inquiry).permit(:name, :phone, :email, :message, :website, attachments: [])
  end
end
