/* Metapost/Hobby curves

Ported to javascript from the PyX implementation (http://pyx.sourceforge.net/)
Copyright (C) 2011 Michael Schindler <m-schindler@users.sourceforge.net>

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

/* Internal functions of MetaPost
This file re-implements some of the functionality of MetaPost
(http://tug.org/metapost). MetaPost was developed by John D. Hobby and
others. The code of Metapost is in the public domain, which we understand as
an implicit permission to reuse the code here (see the comment at
http://www.gnu.org/licenses/license-list.html)

This file is based on the MetaPost version distributed by TeXLive:
svn://tug.org/texlive/trunk/Build/source/texk/web2c/mplibdir revision 22737 #
(2011-05-31)
*/

var mp_endpoint = 0,
mp_explicit = 1,
mp_given = 2,
mp_curl = 3,
mp_open = 4,
mp_end_cycle = 5,
unity = 1.0,
two = 2.0,
fraction_half = 0.5,
fraction_one = 1.0,
fraction_three = 3.0,
one_eighty_deg = Math.PI,
three_sixty_deg = 2 * Math.PI;
var epsilon = 1e-5;

var mp_make_choices = function (knots) {
  var dely_pt, h, k, delx_pt, n, q, p, s, cosine, t, sine;
  // "Implements mp_make_choices from metapost (mp.c)";
  p = knots;
  while (true) {
    if (!p) {
      break;
    }
    q = p.next;
    if (p.rtype > mp_explicit && (Math.pow(p.x_pt - q.x_pt, 2) + Math.pow(p.y_pt - q.y_pt,2) < Math.pow(epsilon, 2))) {
      p.rtype = mp_explicit;
      if (p.ltype == mp_open) {
        p.ltype = mp_curl;
        p.set_left_curl(unity);
      }
      q.ltype = mp_explicit;
      if (q.rtype == mp_open) {
        q.rtype = mp_curl;
        q.set_right_curl(unity);
      }
      p.rx_pt = p.x_pt;
      q.lx_pt = p.x_pt;
      p.ry_pt = p.y_pt;
      q.ly_pt = p.y_pt;
    }
    p = q;
    if (p == knots) {
      break;
    }
  }
  h = knots;
  while (true) {
    if (h.ltype != mp_open || h.rtype != mp_open) {
      break;
    }
    h = h.next;
    if (h == knots) {
      h.ltype = mp_end_cycle;
      break;
    }
  }
  p = h;
  while (true) {
    if (!p) {
      break;
    }

    q = p.next;
    if (p.rtype >= mp_given) {
      while (q.ltype == mp_open && q.rtype == mp_open) {
        q = q.next;
      }
      k = 0;
      s = p;
      n = linked_len(knots);//.linked_len();
      var delta_x = [], delta_y = [], delta = [], psi = [null];
      // tuple([]) = tuple([[], [], [], [null]]);
      while (true) {
        t = s.next;
        // None;
        delta_x.push(t.x_pt - s.x_pt);
        delta_y.push(t.y_pt - s.y_pt);
        delta.push( mp_pyth_add(delta_x[k], delta_y[k]) );
        if (k > 0) {
          sine = mp_make_fraction(delta_y[k - 1], delta[k - 1]);
          cosine = mp_make_fraction(delta_x[k - 1], delta[k - 1]);
          psi.push(
            mp_n_arg(
              mp_take_fraction(delta_x[k], cosine) + mp_take_fraction(delta_y[k], sine),
              mp_take_fraction(delta_y[k], cosine) - mp_take_fraction(delta_x[k], sine)
              )
            );
        }
        k += 1;
        s = t;
        if (s == q) {
          n = k;
        }
        if (k >= n && s.ltype != mp_end_cycle) {
          break;
        }
      }
      if (k == n) {
        psi.push(0);
      } else {
        psi.push(psi[1]);
      }
      if (q.ltype == mp_open) {
        delx_pt = (q.rx_pt - q.x_pt);
        dely_pt = (q.ry_pt - q.y_pt);
        if ((Math.pow(delx_pt, 2) + Math.pow(dely_pt, 2)) < Math.pow(epsilon, 2)) {
          q.ltype = mp_curl;
          q.set_left_curl(unity);
        } else {
          q.ltype = mp_given;
          q.set_left_given(mp_n_arg(delx_pt, dely_pt));
        }
      }
      if (p.rtype == mp_open && p.ltype == mp_explicit) {
        delx_pt = (p.x_pt - p.lx_pt);
        dely_pt = (p.y_pt - p.ly_pt);
        if ((Math.pow(delx_pt, 2) + Math.pow(dely_pt, 2)) < Math.pow(epsilon, 2)) {
          p.rtype = mp_curl;
          p.set_right_curl(unity);
        } else {
          p.rtype = mp_given;
          p.set_right_given(mp_n_arg(delx_pt, dely_pt));
        }
      }
      mp_solve_choices(p, q, n, delta_x, delta_y, delta, psi);
    } else if (p.rtype == mp_endpoint) {
      p.rx_pt = p.x_pt;
      p.ry_pt = p.y_pt;
      q.lx_pt = q.x_pt;
      q.ly_pt = q.y_pt;
    }
    p = q;
    if (p == h) {
      break;
    }
  }
};

var mp_solve_choices = function (p, q, n, delta_x, delta_y, delta, psi) {
  var aa, acc, vv, bb, ldelta, ee, k, s, ww, uu, lt, r, t, ff, theta, rt, dd, cc;
  // "Implements mp_solve_choices form metapost (mp.c)";
  ldelta = delta.length + 1;
  uu = new Array(ldelta);
  ww = new Array(ldelta);
  vv = new Array(ldelta);
  theta = new Array(ldelta);
  for (var i=0; i<ldelta; i++) {
    theta[i] = vv[i] = ww[i] = uu[i] = 0;
  }
  k = 0;
  s = p;
  r = 0;
  while (true) {
    t = s.next;
    if (k == 0) {
      if (s.rtype == mp_given) {
        if (t.ltype == mp_given) {
          aa = mp_n_arg(delta_x[0], delta_y[0]);
          // tuple([ct, st]) = mp_n_sin_cos((p.right_given() - aa));
          // tuple([cf, sf]) = mp_n_sin_cos((q.left_given() - aa));
          ct_st = mp_n_sin_cos(p.right_given() - aa);
          ct = ct_st[0];
          st = ct_st[1];
          cf_sf = mp_n_sin_cos(q.left_given() - aa);
          cf = cf_sf[0];
          sf = cf_sf[1];
          mp_set_controls(p, q, delta_x[0], delta_y[0], st, ct, -sf, cf);
          return;
        } else {
          vv[0] = s.right_given() - mp_n_arg(delta_x[0], delta_y[0]);
          vv[0] = reduce_angle(vv[0]);
          uu[0] = 0;
          ww[0] = 0;
        }
      } else {
        if (s.rtype == mp_curl) {
          if (t.ltype == mp_curl) {
            p.rtype = mp_explicit;
            q.ltype = mp_explicit;
            lt = Math.abs(q.left_tension());
            rt = Math.abs(p.right_tension());
            ff = mp_make_fraction(unity, 3.0 * rt);
            p.rx_pt = p.x_pt + mp_take_fraction(delta_x[0], ff);
            p.ry_pt = p.y_pt + mp_take_fraction(delta_y[0], ff);
            ff = mp_make_fraction(unity, 3.0 * lt);
            q.lx_pt = q.x_pt - mp_take_fraction(delta_x[0], ff);
            q.ly_pt = q.y_pt - mp_take_fraction(delta_y[0], ff);
            return;
          } else {
            cc = s.right_curl();
            lt = Math.abs(t.left_tension());
            rt = Math.abs(s.right_tension());
            uu[0] = mp_curl_ratio(cc, rt, lt);
            vv[0] = -mp_take_fraction(psi[1], uu[0]);
            ww[0] = 0;
          }
        } else {
          if (s.rtype == mp_open) {
            uu[0] = 0;
            vv[0] = 0;
            ww[0] = fraction_one;
          }
        }
      }
    } else {
      if (s.ltype == mp_end_cycle || s.ltype == mp_open) {
        aa = mp_make_fraction(unity, 3.0 * Math.abs(r.right_tension()) - unity);
        dd = mp_take_fraction(delta[k], fraction_three - mp_make_fraction(unity, Math.abs(r.right_tension())));
        bb = mp_make_fraction(unity, 3 * Math.abs(t.left_tension()) - unity);
        ee = mp_take_fraction(delta[k - 1], fraction_three - mp_make_fraction(unity, Math.abs(t.left_tension())));
        cc = (fraction_one - mp_take_fraction(uu[k - 1], aa));
        dd = mp_take_fraction(dd, cc);
        lt = Math.abs(s.left_tension());
        rt = Math.abs(s.right_tension());
        if (lt < rt) {
          dd *= Math.pow(lt / rt, 2);
        } else {
          if (lt > rt) {
            ee *= Math.pow(rt / lt, 2);
          }
        }
        ff = mp_make_fraction(ee, (ee + dd));
        uu[k] = mp_take_fraction(ff, bb);
        acc = -(mp_take_fraction(psi[k + 1], uu[k]));
        if (r.rtype == mp_curl) {
          ww[k] = 0;
          vv[k] = (acc - mp_take_fraction(psi[1], (fraction_one - ff)));
        } else {
          ff = mp_make_fraction((fraction_one - ff), cc);
          acc = (acc - mp_take_fraction(psi[k], ff));
          ff = mp_take_fraction(ff, aa);
          vv[k] = (acc - mp_take_fraction(vv[k - 1], ff));
          ww[k] = -(mp_take_fraction(ww[k - 1], ff));
        }
        if (s.ltype == mp_end_cycle) {
          aa = 0;
          bb = fraction_one;
          while (true) {
            k -= 1;
            if (k == 0) {
              k = n;
            }
            aa = (vv[k] - mp_take_fraction(aa, uu[k]));
            bb = (ww[k] - mp_take_fraction(bb, uu[k]));
            if (k == n) {
              break;
            }
          }
          aa = mp_make_fraction(aa, (fraction_one - bb));
          theta[n] = aa;
          vv[0] = aa;
          // k_val = range(1, n);
          // for (k_idx in k_val) {
          for (var k=1; k<n; k++) {
            // k = k_val[k_idx];
            vv[k] = (vv[k] + mp_take_fraction(aa, ww[k]));
          }
          break;
        }
      } else {
        if (s.ltype == mp_curl) {
          cc = s.left_curl();
          lt = Math.abs(s.left_tension());
          rt = Math.abs(r.right_tension());
          ff = mp_curl_ratio(cc, lt, rt);
          theta[n] = -(mp_make_fraction(mp_take_fraction(vv[n - 1], ff), (fraction_one - mp_take_fraction(ff, uu[n - 1]))));
          break;
        } else {
          if (s.ltype == mp_given) {
            theta[n] = (s.left_given() - mp_n_arg(delta_x[n - 1], delta_y[n - 1]));
            theta[n] = reduce_angle(theta[n]);
            break;
          }
        }
      }
    }
    r = s;
    s = t;
    k += 1;
  }
  // k_val = range((n - 1), -1, -1);
  // for k in range(n-1, -1, -1):
  // for (k_idx in k_val) {
  for (var k=n-1; k>-1; k-=1) {
    // console.log('theta0', k, vv[k], uu[k], theta[k + 1]);
    theta[k] = (vv[k] - mp_take_fraction(theta[k + 1], uu[k]));
    // console.log('theta', k, theta[k]);
  }
  s = p;
  k = 0;
  while (true) {
    t = s.next;
    // tuple([ct, st]) = mp_n_sin_cos(theta[k]);
    // tuple([cf, sf]) = mp_n_sin_cos((-(psi[k + 1]) - theta[k + 1]));
    ct_st = mp_n_sin_cos(theta[k]);
    ct = ct_st[0];
    st = ct_st[1];
    cf_sf = mp_n_sin_cos((-(psi[k + 1]) - theta[k + 1]));
    cf = cf_sf[0];
    sf = cf_sf[1];
    // console.log('mp_set_controls', k, delta_x[k], delta_y[k], st, ct, sf, cf);
    mp_set_controls(s, t, delta_x[k], delta_y[k], st, ct, sf, cf);
    k += 1;
    s = t;
    if (k == n) {
      break;
    }
  }
};

var mp_n_arg = function (x, y) {
  return Math.atan2(y, x);
};
var mp_n_sin_cos = function (z) {
  return [Math.cos(z), Math.sin(z)];
};
var mp_set_controls = function (p, q, delta_x, delta_y, st, ct, sf, cf) {
  var rt, ss, lt, sine, rr;
  lt = Math.abs(q.left_tension());
  rt = Math.abs(p.right_tension());
  rr = mp_velocity(st, ct, sf, cf, rt);
  ss = mp_velocity(sf, cf, st, ct, lt);

  // console.log('lt rt rr ss', lt, rt, rr, ss);
  if (p.right_tension() < 0 || q.left_tension() < 0) {
    if (st >= 0 && sf >= 0 || st <= 0 && sf <= 0) {
      sine = (mp_take_fraction(Math.abs(st), cf) + mp_take_fraction(Math.abs(sf), ct));
      if (sine > 0) {
        sine *= 1.00024414062;
        if (p.right_tension() < 0) {
          if (mp_ab_vs_cd(Math.abs(sf), fraction_one, rr, sine) < 0) {
            rr = mp_make_fraction(abs(sf), sine);
          }
        }
        if (q.left_tension() < 0) {
          if (mp_ab_vs_cd(Math.abs(st), fraction_one, ss, sine) < 0) {
            ss = mp_make_fraction(Math.abs(st), sine);
          }
        }
      }
    }
  }
  p.rx_pt = (p.x_pt + mp_take_fraction((mp_take_fraction(delta_x, ct) - mp_take_fraction(delta_y, st)), rr));
  p.ry_pt = (p.y_pt + mp_take_fraction((mp_take_fraction(delta_y, ct) + mp_take_fraction(delta_x, st)), rr));
  q.lx_pt = (q.x_pt - mp_take_fraction((mp_take_fraction(delta_x, cf) + mp_take_fraction(delta_y, sf)), ss));
  q.ly_pt = (q.y_pt - mp_take_fraction((mp_take_fraction(delta_y, cf) - mp_take_fraction(delta_x, sf)), ss));
  p.rtype = mp_explicit;
  q.ltype = mp_explicit;
};
var mp_make_fraction = function (p, q) {
  return p / q;
};
var mp_take_fraction = function (q, f) {
  return q * f;
};
var mp_pyth_add = function (a, b) {
  return Math.sqrt((a * a + b * b));
};
var mp_curl_ratio = function (gamma, a_tension, b_tension) {
  var alpha, beta;
  alpha = 1.0 / a_tension;
  beta = 1.0 / b_tension;
  return Math.min (4.0,
    ((3.0 - alpha) * Math.pow(alpha, 2) * gamma + Math.pow(beta, 3)) / (Math.pow(alpha, 3) * gamma + (3.0 - beta) * Math.pow(beta, 2))
    );
};
var mp_ab_vs_cd = function (a, b, c, d) {
  if (a * b == c * d) {
    return 0;
  }
  if (a * b > c * d) {
    return 1;
  }
  return -1;
};
var mp_velocity = function (st, ct, sf, cf, t) {
  return Math.min (4.0,
    (2.0 + Math.sqrt(2) * (st - sf / 16.0) * (sf - st / 16.0) * (ct - cf)) / (1.5 * t * ((2 + (Math.sqrt(5) - 1) * ct) + (3 - Math.sqrt(5)) * cf))
    );
};
var reduce_angle = function (A) {
  if (Math.abs(A) > one_eighty_deg) {
    if (A > 0) {
      A -= three_sixty_deg;
    } else {
      A += three_sixty_deg;
    }
  }
  return A;
};
var linked_len = function (self) {
  var n = 1
  var p = self.next
  while (p != self) {
    n += 1;
    p = p.next;
  }
  return n;
};

var makeknots = function (p, tension, cycle) {
  tension = tension || 1;

  var knots = [];

  for (var i=0; i<p.length; i++) {
    knots.push({
      x_pt: p[i][0],
      y_pt: p[i][1],
      ltype: mp_open,
      rtype: mp_open,
      ly_pt: tension,
      ry_pt: tension,
      lx_pt: tension,
      rx_pt: tension,
      left_tension: function() { if (!this.ly_pt) this.ly_pt = 1; return this.ly_pt;},
      right_tension: function() { if (!this.ry_pt) this.ry_pt = 1; return this.ry_pt;},
      left_curl: function() { return this.lx_pt || 0;},
      right_curl: function() { return this.rx_pt || 0;},
      set_right_curl: function(x) { this.rx_pt = x || 0;},
      set_left_curl: function(x) { this.lx_pt = x || 0;}
  });
  }
  for (var i=0; i<knots.length; i++) {
    knots[i].next = knots[i+1] || knots[i];
    knots[i].set_right_given = knots[i].set_right_curl;
    knots[i].set_left_given = knots[i].set_left_curl;
    knots[i].right_given = knots[i].right_curl;
    knots[i].left_given = knots[i].left_curl;
  }
  knots[knots.length - 1].next = knots[0];

  if (!cycle) {
    knots[knots.length-1].rtype = mp_endpoint;
    knots[knots.length-1].ltype = mp_curl;
    knots[0].rtype = mp_curl;
  }

  return knots;
};
