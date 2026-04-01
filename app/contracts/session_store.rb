class SessionStore
  def initialize(session)
    @session = session
  end

  def read(key)
    session[key]
  end

  def write(key, value)
    session[key] = value
  end

  private

  attr_reader :session
end

