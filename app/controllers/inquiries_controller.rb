class InquiriesController < ApplicationController
  def new
    @inquiry = Inquiry.new
    render :create
  end

  def create
    @inquiry = Inquiry.new(inquiry_params)

    if @inquiry.website.present?
      redirect_to new_inquiry_path, notice: "Заявка отправлена — скоро свяжемся."
      return
    end

    if @inquiry.save
      redirect_to new_inquiry_path, notice: "Заявка отправлена — скоро свяжемся."
    else
      flash.now[:alert] = "Проверь поля формы и попробуй ещё раз."
      render :create, status: :unprocessable_entity
    end
  end

  private

  def inquiry_params
    params.require(:inquiry).permit(:name, :phone, :email, :message, :website)
  end
end
