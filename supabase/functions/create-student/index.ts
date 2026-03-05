import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    const { full_name, email, school, grade, phone } = await req.json()

    if (!full_name || !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nombre y email son obligatorios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let tempPassword = 'Ecoems'
    for (let i = 0; i < 8; i++) {
      tempPassword += chars[Math.floor(Math.random() * chars.length)]
    }
    tempPassword += '!'

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: full_name }
    })

    if (authError) {
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const userId = authData.user.id

    await supabaseAdmin.from('user_profiles').insert({
      id: userId,
      full_name: full_name,
      email: email,
      role: 'student',
      status: 'active',
      exams_purchased: 1,
      exams_remaining: 1,
      is_admin_created: true,
      enrollment_date: new Date().toISOString().split('T')[0],
      school: school || null,
      grade: grade || null,
      phone: phone || null
    })

    await supabaseAdmin.from('manual_purchases').insert({
      student_id: userId,
      staff_id: '2578d13a-fc5b-4028-b0f5-5071094e1170',
      exams_granted: 1,
      payment_method: 'pago_inicial',
      notes: full_name
    })

    await supabaseAdmin.from('exam_assignments').insert({
      user_id: userId,
      exam_type: 'monthly_1',
      start_date: new Date().toISOString(),
      completed: false
    })

    return new Response(
      JSON.stringify({
        success: true,
        student: { id: userId, full_name: full_name, email: email, temp_password: tempPassword }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})