class InquiriesController < ApplicationController
  def create
    @inquiry = Inquiry.new(inquiry_params)

    if @inquiry.save
      redirect_to root_path(anchor: "contact"), notice: "Сообщение отправлено. Мы свяжемся с вами."
    else
      flash[:alert] = "Проверьте поля формы и попробуйте ещё раз."
      redirect_to root_path(anchor: "contact"), status: :see_other
    end
  end

  private

  def inquiry_params
    params.require(:inquiry).permit(:name, :contact, :message)
  end
end
