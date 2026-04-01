class InquiriesController < ApplicationController
  def new
    @inquiry = Inquiry.new
    render :create
  end

  def create
    @inquiry = Inquiry.new(inquiry_params)

    if @inquiry.save
      redirect_to new_inquiry_path, notice: "Сообщение отправлено. Мы свяжемся с вами."
    else
      flash.now[:alert] = "Проверьте поля формы и попробуйте ещё раз."
      render :create, status: :unprocessable_entity
    end
  end

  private

  def inquiry_params
    params.require(:inquiry).permit(:name, :phone, :email, :message)
  end
end
