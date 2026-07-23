UPDATE admin_users
SET must_change_password = true
WHERE email IN (
  'sandeep.chinamanagonda@woxza.io',
  'prathyusha.kommuru@woxza.io',
  'hemanth_khande@woxza.io'
)
  AND last_login_at IS NULL;
